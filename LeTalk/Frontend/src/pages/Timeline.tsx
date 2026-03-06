import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Heart, Edit3, Trash2, Save, RefreshCw, Loader2 } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API, getAuthToken } from '../config/api';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string from backend
  location?: string;
  imageUrl?: string;
  createdBy: string;
  isSpecial: boolean;
}

const Timeline: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    isSpecial: false
  });

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API.TIMELINE, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load timeline');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.date) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(API.TIMELINE_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) throw new Error('Failed to create event');

      const createdEvent = await response.json();
      setEvents(prev => [...prev, createdEvent]);
      setIsCreating(false);
      setNewEvent({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        isSpecial: false
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setNewEvent({
      ...event,
      date: new Date(event.date).toISOString().split('T')[0]
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent || !newEvent.title || !newEvent.description || !newEvent.date) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(API.TIMELINE_UPDATE(editingEvent.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) throw new Error('Failed to update event');

      setEvents(prev =>
        prev.map(event =>
          event.id === editingEvent.id
            ? { ...event, ...newEvent } as TimelineEvent
            : event
        )
      );
      setEditingEvent(null);
      setNewEvent({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        isSpecial: false
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      const response = await fetch(API.TIMELINE_DELETE(id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete event');

      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

    if (diffInMonths === 0) return 'This month';
    if (diffInMonths === 1) return '1 month ago';
    if (diffInMonths < 12) return `${diffInMonths} months ago`;
    const years = Math.floor(diffInMonths / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-pink-50'}`}>
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-pink-50 text-gray-800'}`}>
      {/* Header */}
      <div className={`border-b p-4 fixed w-full top-0 left-0 z-40 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Our Timeline</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{events.length} precious moments</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-transform active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto pt-24 pb-20">
        {/* Form */}
        {(isCreating || editingEvent) && (
          <div className={`rounded-xl p-6 mb-8 shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {editingEvent ? <Edit3 size={18} /> : <Plus size={18} />}
              {editingEvent ? 'Edit Memory' : 'Add New Memory'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</label>
                <input
                  type="text"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-pink-100'}`}
                  placeholder="What happened?"
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</label>
                <textarea
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 h-24 resize-none outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-pink-100'}`}
                  placeholder="Tell the story..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</label>
                  <input
                    type="date"
                    value={newEvent.date || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-pink-100'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</label>
                  <input
                    type="text"
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-pink-100'}`}
                    placeholder="Where did it happen?"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSpecial"
                  checked={newEvent.isSpecial || false}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, isSpecial: e.target.checked }))}
                  className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                />
                <label htmlFor="isSpecial" className={`text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mark as special milestone ✨
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={editingEvent ? handleSaveEdit : handleCreateEvent}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : (editingEvent ? <Save size={18} /> : <Plus size={18} />)}
                  <span>{editingEvent ? 'Save Changes' : 'Add Memory'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingEvent(null);
                    setNewEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], location: '', isSpecial: false });
                  }}
                  className={`px-6 py-2.5 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-8 relative">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative group">
              {/* Line */}
              {index < sortedEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-pink-100 -z-10 group-hover:bg-pink-200 transition-colors"></div>
              )}

              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${event.isSpecial ? 'bg-gradient-to-br from-violet-600 to-pink-500' : 'bg-violet-100'
                  }`}>
                  {event.isSpecial ? (
                    <Heart className="w-5 h-5 text-white" fill="white" />
                  ) : (
                    <Calendar className="w-5 h-5 text-violet-600" />
                  )}
                </div>

                <div className={`flex-1 rounded-2xl p-6 shadow-sm border transition-shadow ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:shadow-gray-900/50' : 'bg-white border-pink-50 hover:shadow-md'}`}>
                  <div className="flex justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
                      <div className={`flex flex-wrap items-center gap-2 text-xs font-medium mt-1 uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                        <span>{formatDate(event.date)}</span>
                        <span>•</span>
                        <span className="text-violet-500">{getRelativeTime(event.date)}</span>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <MapPin size={10} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditEvent(event)} className="p-1.5 text-gray-400 hover:text-violet-600">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{event.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                      Added by {event.createdBy === user?.name ? 'You' : event.createdBy}
                    </span>
                    {event.isSpecial && (
                      <span className="text-[10px] bg-pink-50 text-pink-600 font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                        MILESTONE ✨
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-pink-200">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No memories yet</h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Start documenting your relationship journey here!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-violet-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200"
            >
              Add First Memory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;