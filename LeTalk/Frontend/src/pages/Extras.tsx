import React, { useState, useEffect } from 'react';
import { Heart, Gift, Gamepad2 as GamePad2, Coffee, Plus, Star, BookOpen } from 'lucide-react';
import { useTheme } from '../components/ThemeContext'; // Adjust the import path as needed
import { API, getAuthToken } from '../config/api';

interface LoveNote {
  id: string;
  message: string;
  addedBy: string;
  isRevealed: boolean;
  addedAt: Date;
}

interface TodoItem {
  id: string;
  title: string;
  isCompleted: boolean;
  addedBy: string;
}

const Extras: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'love-jar' | 'todo' | 'games'>('love-jar');
  const [newLoveNote, setNewLoveNote] = useState('');
  const [newTodoItem, setNewTodoItem] = useState('');

  // Mock love jar data
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  // Mini Games State
  const [gameModal, setGameModal] = useState<{ isOpen: boolean; title: string; questions: string[]; currentIndex: number }>({
    isOpen: false,
    title: '',
    questions: [],
    currentIndex: 0
  });

  const GAMES_CONTENT = {
    deepTalk: [
      "Apa hal pertama yang membuatmu jatuh cinta padaku?",
      "Jika kita punya waktu 24 jam terakhir di dunia, apa yang ingin kamu lakukan bersamaku?",
      "Apa ketakutan terbesarmu dalam hubungan kita?",
      "Bagaimana caraku paling bisa membuatmu merasa dihargai?",
      "Apa kenangan masa kecil yang paling membentuk dirimu sekarang?",
      "Apa satu hal yang ingin kamu ubah dari dirimu sendiri?"
    ],
    wouldYouRather: [
      "Lebih baik liburan ke kutub yang dingin atau gurun yang panas bersama pasangan?",
      "Lebih baik punya pasangan yang jago masak tapi cuek, atau jago romantis tapi masakannya zonk?",
      "Lebih baik tinggal di apartemen mewah di kota atau rumah kayu sederhana di pinggir danau?",
      "Lebih baik bisa baca pikiran pasangan atau bisa liat masa depan berdua?",
      "Lebih baik kencan nonton film di bioskop atau masak bareng di rumah?",
    ],
    truth: [
      "Apa kebiasaan burukku yang sebenarnya paling membuatmu jengkel?",
      "Pernahkah kamu pura-pura suka dengan hadiah yang kuberikan?",
      "Apa hal pertama yang kamu ceritakan ke sahabatmu saat kita pertama kali berkencan?",
      "Kalau kamu bisa tukar nasib denganku seharian, apa hal pertama yang akan kamu lakukan?",
    ],
    dare: [
      "Kirimkan pesan suara 'I love you' paling imut sekarang juga!",
      "Lakukan tarian konyol selama 30 detik di depanku (atau kirim videonya)!",
      "Puji aku 5 kali dengan alasan yang berbeda-beda!",
      "Tunjukkan foto paling memalukan di galeri ponselmu!",
    ]
  };

  const openGame = (type: keyof typeof GAMES_CONTENT | 'truth-or-dare') => {
    let title = '';
    let questions: string[] = [];

    if (type === 'deepTalk') {
      title = 'Deep Talk Questions';
      questions = [...GAMES_CONTENT.deepTalk].sort(() => Math.random() - 0.5);
    } else if (type === 'wouldYouRather') {
      title = 'Would You Rather?';
      questions = [...GAMES_CONTENT.wouldYouRather].sort(() => Math.random() - 0.5);
    } else if (type === 'truth-or-dare') {
      title = 'Truth or Dare?';
      const combined = [...GAMES_CONTENT.truth, ...GAMES_CONTENT.dare].sort(() => Math.random() - 0.5);
      questions = combined;
    }

    setGameModal({
      isOpen: true,
      title,
      questions,
      currentIndex: 0
    });
  };

  const nextQuestion = () => {
    setGameModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.questions.length
    }));
  };

  useEffect(() => {
    fetch(API.EXTRAS, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load extras');
        return res.json();
      })
      .then(data => {
        const jar = (data.loveJar || []).map((note: any) => ({
          ...note,
          id: note._id,
          addedAt: new Date(note.addedAt)
        }));
        const todos = (data.todoList || []).map((t: any) => ({
          ...t,
          id: t._id
        }));
        setLoveNotes(jar);
        setTodoItems(todos);
      })
      .catch(err => {
        console.error('Failed to load extras:', err);
      });
  }, []);

  const handleAddLoveNote = async () => {
    if (!newLoveNote.trim()) return;

    const res = await fetch(API.LOVEJAR_ADD, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ message: newLoveNote })
    });
    if (res.ok) {
      const newNote = await res.json();
      setLoveNotes(prev => [{
        ...newNote,
        id: newNote._id,
        addedAt: new Date(newNote.addedAt)
      }, ...prev]);
      setNewLoveNote('');
    }
  };

  const handleRevealNote = async (id: string) => {
    await fetch(API.LOVEJAR_REVEAL(id), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      credentials: 'include'
    });
    setLoveNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, isRevealed: true } : note
      )
    );
  };

  const handleAddTodo = async () => {
    if (!newTodoItem.trim()) return;

    const res = await fetch(API.TODO_ADD, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ title: newTodoItem })
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodoItems(prev => [...prev, {
        ...newTodo,
        id: newTodo._id,
      }]);
      setNewTodoItem('');
    }
  };

  const handleToggleTodo = async (id: string) => {
    await fetch(API.TODO_TOGGLE(id), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      credentials: 'include'
    });
    setTodoItems(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const handleDeleteTodo = async (id: string) => {
    await fetch(API.TODO_DELETE(id), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      credentials: 'include'
    });
    setTodoItems(prev => prev.filter(todo => todo.id !== id));
  };

  const handleDeleteLoveNote = async (id: string) => {
    await fetch(API.LOVEJAR_DELETE(id), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      credentials: 'include'
    });
    setLoveNotes(prev => prev.filter(note => note.id !== id));
  };

  const tabs = [
    { id: 'love-jar', label: 'Love Jar', icon: Heart },
    { id: 'todo', label: 'To-Do List', icon: BookOpen },
    { id: 'games', label: 'Games', icon: GamePad2 }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-pink-50 text-gray-800'}`}>
      {/* Header */}
      <div className={`px-4 py-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-200'}`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Extras</h1>
          <p className={`text-sm sm:text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fun activities and surprises for you both</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`sticky top-0 z-40 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 font-medium transition-all duration-200 whitespace-nowrap min-w-0 flex-shrink-0 ${activeTab === tab.id
                  ? 'border-violet-600 text-violet-600 bg-pink-50'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-pink-400 hover:bg-gray-700' : 'text-gray-600 hover:text-violet-600 hover:bg-pink-25'}`
                  }`}
              >
                <tab.icon size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto ${isDarkMode ? 'text-gray-300' : ''}`}>
        {/* Love Jar */}
        {activeTab === 'love-jar' && (
          <div className="space-y-4 sm:space-y-6">
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                <div className="bg-pink-100 p-3 rounded-full w-fit">
                  <Heart className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold">Love Jar</h2>
                  <p className={`text-sm sm:text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Add sweet messages for each other to discover
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <textarea
                    value={newLoveNote}
                    onChange={(e) => setNewLoveNote(e.target.value)}
                    placeholder="Write a sweet message for your partner..."
                    className={`w-full px-4 py-3 sm:px-5 sm:py-4 border rounded-xl focus:ring-2 focus:ring-violet-500 h-20 sm:h-24 resize-none text-sm sm:text-base transition-all duration-200 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-pink-200'}`}
                  />
                  <button
                    onClick={handleAddLoveNote}
                    disabled={!newLoveNote.trim()}
                    className={`mt-3 sm:mt-4 px-6 py-3 sm:px-8 sm:py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-all duration-200 w-full sm:w-auto min-h-[44px] ${isDarkMode ? 'hover:bg-violet-700' : ''}`}
                  >
                    <Plus size={16} />
                    <span className="text-sm sm:text-base">Add to Love Jar</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {loveNotes.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-violet-600" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Your Love Jar is empty</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add your first sweet message above! 💕</p>
                </div>
              )}
              {loveNotes.map((note) => (
                <div
                  key={note.id}
                  className={`relative rounded-xl p-4 sm:p-6 shadow-sm border-2 transition-all duration-200 ${note.isRevealed
                    ? `border-pink-200 hover:shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`
                    : `border-pink-400 cursor-pointer hover:border-violet-500 hover:shadow-md transform hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`
                    }`}
                  onClick={() => !note.isRevealed && handleRevealNote(note.id)}
                >
                  {/* Delete Button (Always visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLoveNote(note.id);
                    }}
                    className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-red-400 hover:text-red-600 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                    title="Delete"
                  >
                    ×
                  </button>
                  {note.isRevealed ? (
                    <div className="pr-8 sm:pr-10">
                      <p className={`mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{note.message}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                        <span className="font-medium">From {note.addedBy}</span>
                        <span>{note.addedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6">
                      <Gift className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4 ${isDarkMode ? 'text-pink-400' : 'text-violet-600'}`} />
                      <p className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Surprise from {note.addedBy}</p>
                      <p className={`text-xs sm:text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Tap to reveal</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* To-Do List */}
        {activeTab === 'todo' && (
          <div className="space-y-4 sm:space-y-6">
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                <div className="bg-purple-100 p-3 rounded-full w-fit">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold">Shared To-Do List</h2>
                  <p className={`text-sm sm:text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Goals and activities to do together
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  value={newTodoItem}
                  onChange={(e) => setNewTodoItem(e.target.value)}
                  placeholder="Add something to do together..."
                  className={`flex-1 px-4 py-3 sm:px-5 sm:py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 text-sm sm:text-base transition-all duration-200 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-pink-200'}`}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                />
                <button
                  onClick={handleAddTodo}
                  disabled={!newTodoItem.trim()}
                  className={`px-6 py-3 sm:px-8 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 w-full sm:w-auto min-h-[44px] ${isDarkMode ? 'hover:bg-purple-700' : ''}`}
                >
                  <Plus size={16} />
                  <span className="ml-2 sm:hidden">Add Item</span>
                </button>
              </div>
            </div>
            <div className={`rounded-xl p-4 sm:p-6 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
              <div className="space-y-3 sm:space-y-4">
                {todoItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${item.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : `hover:border-violet-700 hover:shadow-sm ${isDarkMode ? 'bg-gray-700 border-pink-400' : 'bg-gray-50 border-gay-500'}`
                      }`}
                  >
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleTodo(item.id)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${item.isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : `border-gray-300 hover:border-purple-600 ${isDarkMode ? 'hover:border-purple-400' : ''}`
                        }`}
                    >
                      {item.isCompleted && <span className="text-xs sm:text-sm">✓</span>}
                    </button>
                    {/* Title */}
                    <span
                      className={`flex-1 text-sm sm:text-base transition-all duration-200 ${item.isCompleted ? 'text-gray-500 line-through' : `text-gray-800 ${isDarkMode ? 'text-gray-300' : ''}`
                        }`}
                    >
                      {item.title}
                    </span>
                    {/* Metadata */}
                    <span className={`text-xs sm:text-sm text-gray-500 hidden sm:inline ${isDarkMode ? 'text-gray-400' : ''}`}>by {item.addedBy}</span>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTodo(item.id)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-red-400 hover:text-red-600 text-lg sm:text-xl font-semibold rounded-full hover:bg-red-50 transition-all duration-200 flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-600' : ''}`}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Games */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 sm:p-8 shadow-sm text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
              <div className={`p-4 rounded-full w-fit mx-auto mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'}`}>
                <GamePad2 className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Mir'Ah Playground</h2>
              <p className={`text-sm max-w-md mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Koleksi aktivitas seru untuk mempererat bonding kalian berdua. No pressure, just fun! 🎮
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className={`group rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
                <div className={`p-3 rounded-xl w-fit mb-4 ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-50'}`}>
                  <Coffee className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Deep Talk Questions</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  50+ pertanyaan bermakna untuk mengenal sisi terdalam pasanganmu. Cocok untuk 'pillow talk'.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">
                  <span className="px-2 py-1 rounded bg-indigo-500/10">Emotional</span>
                  <span className="px-2 py-1 rounded bg-indigo-500/10">Bonding</span>
                </div>
                <button
                  onClick={() => openGame('deepTalk')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Mulai Deep Talk 💬
                </button>
              </div>

              <div className={`group rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
                <div className={`p-3 rounded-xl w-fit mb-4 ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-50'}`}>
                  <Star className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Would You Rather?</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pilih satu dari dua situasi sulit dan lihat apakah pilihan kalian sama atau justru bertolak belakang!
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider mb-4">
                  <span className="px-2 py-1 rounded bg-orange-500/10">Funny</span>
                  <span className="px-2 py-1 rounded bg-orange-500/10">Interactive</span>
                </div>
                <button
                  onClick={() => openGame('wouldYouRather')}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all"
                >
                  Mainkan Sekarang 🎭
                </button>
              </div>

              <div className={`group rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
                <div className={`p-3 rounded-xl w-fit mb-4 ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
                  <Gift className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Daily Couple Mission</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Misi kecil harian seperti "Puji pasanganmu 3x hari ini" atau "Kirimkan lagu favoritmu".
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4">
                  <span className="px-2 py-1 rounded bg-emerald-500/10">Activity</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/10">Romantic</span>
                </div>
                <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">
                  Ambil Misi Hari Ini 🚀
                </button>
              </div>

              <div className={`group rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
                <div className={`p-3 rounded-xl w-fit mb-4 ${isDarkMode ? 'bg-rose-900/50' : 'bg-rose-50'}`}>
                  <Heart className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Truth or Dare</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Klasik yang tak pernah gagal. Jujur sepenuhnya atau lakukan tantangan romantis yang mendebarkan!
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider mb-4">
                  <span className="px-2 py-1 rounded bg-rose-500/10">Classic</span>
                  <span className="px-2 py-1 rounded bg-rose-500/10">Spicy</span>
                </div>
                <button
                  onClick={() => openGame('truth-or-dare')}
                  className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
                >
                  Tantang Pasanganmu 🕯️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Modal */}
      {gameModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`relative w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            {/* Visual Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-600/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-violet-100 text-violet-600 text-xs font-bold rounded-full uppercase tracking-widest">
                  {gameModal.title}
                </span>
                <button
                  onClick={() => setGameModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Plus size={24} className="rotate-45 text-gray-400" />
                </button>
              </div>

              <div className="min-h-[160px] flex flex-col items-center justify-center text-center">
                <div className="mb-4 text-4xl">✨</div>
                <h3 className={`text-xl sm:text-2xl font-bold leading-relaxed mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  "{gameModal.questions[gameModal.currentIndex]}"
                </h3>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={nextQuestion}
                  className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-lg hover:shadow-violet-500/20 active:scale-95"
                >
                  Pertanyaan Selanjutnya ➔
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Slide {gameModal.currentIndex + 1} of {gameModal.questions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
};

export default Extras;