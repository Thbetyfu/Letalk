import React, { createContext, useContext, useState, useCallback } from 'react';

interface Message {
  id: string;
  senderEmail: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'audio';
  imageUrl?: string | null;
  audioUrl?: string | null;
  seen: boolean;
  emotion?: string | null;
  toxicity_score?: number | null;
  is_toxic?: boolean;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (content: string, type?: 'text' | 'image' | 'audio') => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'audio' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderEmail: 'test@example.com',
      senderName: 'Alex',
      content,
      timestamp: new Date(),
      type,
      seen: false,
      ...(type === 'image' && { imageUrl: content }),
      ...(type === 'audio' && { audioUrl: content })
    };

    setMessages(prev => [...prev, newMessage]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isTyping, setIsTyping }}>
      {children}
    </ChatContext.Provider>
  );
};