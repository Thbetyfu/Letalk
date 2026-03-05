import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Mic, Smile, CheckCircle, AlertCircle, Heart, X, Bell, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/ThemeContext'; // Adjust the import path as needed
import { API, getAuthToken } from '../config/api';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ChatMessage {
  id: string;
  senderEmail: string;
  senderName?: string;
  content: string;
  type: string;
  timestamp: Date;
  imageUrl?: string;
  seen: boolean;
  emotion?: string | null;
  toxicity_score?: number | null;
}

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊', love: '❤️', excitement: '🎉', gratitude: '🙏',
  caring: '🤗', admiration: '😍', optimism: '✨', pride: '💪',
  anger: '😠', annoyance: '😤', sadness: '😢', disappointment: '😞',
  fear: '😨', disgust: '🤢', grief: '💔', nervousness: '😰',
  neutral: '😐', curiosity: '🤔', confusion: '😕', surprise: '😮',
};

const CooldownTimer: React.FC<{ expiresAt: string, onExpire: () => void }> = ({ expiresAt, onExpire }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        clearInterval(interval);
        onExpire();
      } else {
        setRemaining(Math.ceil(diff / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="text-3xl font-mono font-bold text-red-600">
      {mins}:{String(secs).padStart(2, '0')}
    </div>
  );
};

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const [aiEmotion, setAiEmotion] = useState<{ sender: string; emotion: string; is_toxic: boolean } | null>(null);
  const [conflictCooldown, setConflictCooldown] = useState<{ active: boolean; remaining: number; expiresAt: string } | null>(null);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [systemMsg, setSystemMsg] = useState<string | null>(null);

  const [isWindowVisible, setIsWindowVisible] = useState(!document.hidden);
  const [partnerOnline, setPartnerOnline] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      console.log('Visibility changed, isVisible:', isVisible);
      setIsWindowVisible(isVisible);
      if (
        isVisible &&
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        console.log('Sending mark_seen message');
        socketRef.current.send(JSON.stringify({ type: 'mark_seen' }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?.partnerCode) return;

    const connectWebSocket = () => {
      const socket = new WebSocket(API.CHAT_WS(user.partnerCode!));
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'chat_message':
            const msg = data.message;
            setMessages(prev => {
              if (prev.some(m => m.id === (msg._id || msg.id))) return prev;

              return [...prev, {
                id: msg._id || msg.id || Date.now().toString(),
                senderEmail: msg.senderEmail,
                senderName: msg.senderName,
                content: msg.message,
                type: msg.type || 'text',
                timestamp: new Date(msg.timestamp),
                seen: msg.seen || false,
                emotion: msg.emotion || null,
                toxicity_score: msg.toxicity_score || null,
              }];
            });

            if (msg.senderEmail !== user?.email) {
              setNotificationMsg('New message from your partner');
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 3000);
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Letalk", {
                  body: msg.message,
                  icon: "/favicon.ico"
                });
              }
            }
            break;

          case 'system':
            setSystemMsg(data.message);
            setTimeout(() => setSystemMsg(null), 5000);
            break;

          case 'ai_update':
            setAiEmotion({
              sender: data.sender,
              emotion: data.emotion,
              is_toxic: data.is_toxic,
            });
            break;

          case 'conflict_detected':
            setConflictCooldown({
              active: true,
              remaining: data.data.cooldown_seconds,
              expiresAt: data.data.expires_at,
            });
            showToast('🚨 AI Mediator mendeteksi konflik! Chat dikunci 5 menit.', 'error');
            break;

          case 'ai_reflection':
            setAiReflection(data.data.message);
            break;

          case 'cooldown_active':
            setConflictCooldown(prev => prev ? { ...prev, remaining: data.remaining_seconds } : null);
            showToast(`⏳ ${data.message}`, 'info');
            break;

          case 'seen_update':
            setMessages(prev => prev.map(m =>
              m.id === data.message_id ? { ...m, seen: data.seen } : m
            ));
            break;

          case 'reminder_alert':
            showToast(`🔔 Reminder: ${data.reminder.title} - ${data.reminder.description}`, 'info');
            break;
        }
      };

      socket.onclose = () => {
        console.warn("WebSocket closed");
        setPartnerOnline(false);
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectAttempts.current += 1;
          showToast(`Koneksi terputus. Reconnect dalam ${delay / 1000}s...`, 'error');
          reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), delay);
        } else {
          showToast('Koneksi gagal. Silakan refresh halaman.', 'error');
        }
      };

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        setPartnerOnline(true);
        showToast('Terhubung ke chat! 💕', 'success');
        if (!document.hidden && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'mark_seen' }));
        }
      };

      return socket;
    };

    const socket = connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socket.close();
    };
  }, [user?.partnerCode]);

  const sendMessageToBackend = async (content: string, type: string = 'text', imageUrl?: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(API.SEND_MESSAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: type,
          content: type === 'image' ? imageUrl : content
        })
      });

      if (response.ok) {
        if (type === 'image') {
          showToast('Image sent successfully! 📸💕', 'success');
        }
      } else {
        const err = await response.json();
        console.error('Failed to send message:', err.error || 'Unknown error');
        showToast('Failed to send message. Please try again', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      showToast('Please check your connection and try again', 'error');
      return;
    }

    const payload = {
      message: message.trim(),
      senderName: user?.name || 'User',
      senderEmail: user?.email || '',
      type: 'text'
    };

    socketRef.current.send(JSON.stringify(payload));
    setMessage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('Uploading your precious moment... 📸', 'info');
      const imageUrl = URL.createObjectURL(file);
      sendMessageToBackend('', 'image', imageUrl);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-pink-50'}`}>
      {showNotification && (
        <div className="fixed top-0 left-0 w-full bg-violet-600 text-white text-center py-2 z-50 transition">
          {notificationMsg}
        </div>
      )}

      {conflictCooldown?.active && (
        <div className="fixed top-20 left-0 right-0 z-20 mx-4 animate-slide-in">
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🚨</span>
              <h3 className="font-bold text-red-700 text-lg">AI Mediator Aktif</h3>
            </div>
            <p className="text-red-600 text-sm font-medium mb-2">
              Chat dikunci sementara untuk memberi ruang refleksi
            </p>
            <CooldownTimer expiresAt={conflictCooldown.expiresAt} onExpire={() => setConflictCooldown(null)} />
          </div>
        </div>
      )}

      {aiReflection && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-slide-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-violet-300">
            <div className="text-center mb-4">
              <div className="bg-violet-100 p-3 rounded-full w-fit mx-auto mb-2">
                <Bot className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-bold text-violet-700 text-lg">AI Mediator</h3>
              <p className="text-xs text-gray-500">Refleksi untuk kamu</p>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed text-center mb-4 whitespace-pre-line">
              {aiReflection}
            </p>
            <button
              onClick={() => setAiReflection(null)}
              className="w-full bg-violet-600 text-white py-2 rounded-xl font-semibold hover:bg-violet-700 transition"
            >
              Saya Mengerti 💙
            </button>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm
              border-l-4 min-w-80 max-w-96 transform transition-all duration-300 ease-in-out
              animate-slide-in
              ${toast.type === 'success'
                ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-400 text-pink-800'
                : toast.type === 'error'
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400 text-red-800'
                  : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-400 text-purple-800'
              }
            `}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <CheckCircle size={18} className="text-violet-600" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle size={18} className="text-red-600" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  {toast.message.includes('🔔') ? (
                    <Bell size={18} className="text-purple-600" />
                  ) : (
                    <Heart size={18} className="text-purple-600" />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      {/* Header */}
      <div className={` border-b border-pink-200 p-4 fixed w-full z-10 top-0 animate-slide-in ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.partnerName?.charAt(0) || 'P'}
              </span>
            </div>
            <div>
              <h1 className="font-semibold ">
                {user?.partnerName || 'Partner'}
              </h1>
              <p className={`text-sm ${partnerOnline ? 'text-green-600' : 'text-gray-400'}`}>
                {partnerOnline ? '● Online' : '○ Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-20 pb-36">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderEmail === user?.email ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md relative px-4 py-2 rounded-xl ${msg.senderEmail === user?.email
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-800 border border-pink-200'
                }`}
            >
              {msg.emotion && (
                <span
                  className="text-xs absolute -top-2 -right-2 bg-white rounded-full shadow px-1 border border-pink-100"
                  title={msg.emotion}
                >
                  {EMOTION_EMOJI[msg.emotion] || '💬'}
                </span>
              )}
              {msg.type === 'image' ? (
                <div className="space-y-2">
                  <img
                    src={msg.imageUrl}
                    alt="Shared image"
                    className="rounded-lg max-w-full h-auto"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs opacity-75">{formatTime(msg.timestamp)}</p>
                    {msg.senderEmail === user?.email && (
                      <span className={`text-xs ${msg.seen ? 'text-blue-500' : 'text-gray-500'}`}>
                        {msg.seen ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="break-words">{msg.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs opacity-75">{formatTime(msg.timestamp)}</p>
                    {msg.senderEmail === user?.email && (
                      <span className={`text-xs ${msg.seen ? 'text-blue-500' : 'text-gray-500'}`}>
                        {msg.seen ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {systemMsg && (
          <div className="flex justify-center my-2">
            <span className="bg-violet-50 text-violet-600 text-xs px-3 py-1 rounded-full border border-violet-200 shadow-sm text-center">
              {systemMsg}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={` p-4 fixed bottom-14 w-full mb-6 ${isDarkMode ? 'bg-gray-800 border border-violet-600 rounded-xl' : 'bg-white border-t border-pink-200 '}`}>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                conflictCooldown?.active
                  ? "⏳ Chat dikunci oleh AI Mediator..."
                  : "Tulis pesan..."
              }
              disabled={conflictCooldown?.active || isLoading}
              className={`w-full px-4 py-2 pr-12 rounded-full border border-pink-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} transition-colors ${conflictCooldown?.active ? 'bg-gray-200 cursor-not-allowed opacity-60' : ''}`}
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isLoading || !!conflictCooldown?.active}
            className="p-2 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      <style>
        {`
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default Chat;