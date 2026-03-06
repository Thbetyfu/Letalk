import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Brain, Zap, Heart, MessageCircle, AlertTriangle, ShieldCheck,
    RefreshCw, Info, HelpCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';
import { API, getAuthToken } from '../config/api';

interface EmotionStats {
    emotion_counts: Record<string, number>;
    total_messages: number;
}

interface AIAnalysis {
    conversation_health: number;
    potential_issues: string[];
    positive_signs: string[];
    tip_for_a: string;
    tip_for_b: string;
    overall_mood: 'happy' | 'neutral' | 'tense' | 'heated';
}

const EMOTION_COLORS: Record<string, string> = {
    joy: '#10b981',      // Emerald 500
    love: '#ec4899',     // Pink 500
    neutral: '#94a3b8',  // Slate 400
    surprise: '#8b5cf6', // Violet 500
    sadness: '#3b82f6',  // Blue 500
    anger: '#ef4444',    // Red 500
    fear: '#f59e0b',     // Amber 500
    toxic: '#7f1d1d',    // Dark red
};

const MOOD_EMOJIS: Record<string, string> = {
    happy: '😊',
    neutral: '😐',
    tense: '😟',
    heated: '🔥',
};

const MoodDashboard: React.FC = () => {
    const [stats, setStats] = useState<EmotionStats | null>(null);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = getAuthToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Parallel fetch Stats and Analysis
            const [statsRes, analysisRes] = await Promise.all([
                fetch(API.MOOD_DASHBOARD, { headers, credentials: 'include' }),
                fetch(API.ANALYZE_CONVERSATION, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    credentials: 'include'
                })
            ]);

            if (!statsRes.ok) throw new Error('Failed to fetch mood stats');
            if (!analysisRes.ok) throw new Error('Failed to analyze conversation');

            const statsData = await statsRes.json();
            const analysisData = await analysisRes.json();

            setStats(statsData);
            setAnalysis(analysisData.analysis);
        } catch (err: any) {
            console.error('Mood Dashboard fetch error:', err);
            setError(err.message || 'Terjadi kesalahan saat memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const prepareChartData = () => {
        if (!stats) return [];
        return Object.entries(stats.emotion_counts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: EMOTION_COLORS[name] || '#64748b'
        })).sort((a, b) => b.value - a.value);
    };

    const chartData = prepareChartData();

    if (isLoading) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Memuat Analisis Mood...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 pb-24">
            <header className="flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10 py-2">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Mood Dashboard <TrendingUp className="text-emerald-500" />
                </h1>
                <button
                    onClick={fetchData}
                    className="p-2 hover:bg-violet-100 rounded-full transition-colors text-violet-600"
                    title="Refresh Data"
                >
                    <RefreshCw size={20} />
                </button>
            </header>

            {/* Main Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Relationship Health Card */}
                <div className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col items-center text-center relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4">
                        <Info size={18} className="text-gray-300 cursor-help" title="Health Score dihitung dari harmoni percakapan terbaru" />
                    </div>
                    <h3 className="text-gray-500 font-medium mb-6">Relationship Health Score</h3>

                    <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-gray-100"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * (analysis?.conversation_health || 0)) / 10}
                                className={`${(analysis?.conversation_health || 0) >= 8 ? 'text-emerald-500' :
                                        (analysis?.conversation_health || 0) >= 4 ? 'text-amber-500' : 'text-red-500'
                                    } transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-black text-gray-800">{(analysis?.conversation_health || 0) * 10}</span>
                            <span className="text-xs font-bold text-gray-400">POINTS</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-4 py-2 rounded-full border flex items-center gap-2">
                        <span className="text-xl">{MOOD_EMOJIS[analysis?.overall_mood || 'neutral']}</span>
                        <span className="font-bold text-gray-700 capitalize">Mood: {analysis?.overall_mood}</span>
                    </div>
                </div>

                {/* Emotion Distribution (Bar Chart) */}
                <div className="bg-white rounded-3xl shadow-sm border p-6 h-full flex flex-col">
                    <h3 className="text-gray-700 font-bold mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" /> Distribusi Emosi (50 Pesan Terakhir)
                    </h3>
                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="bg-white rounded-3xl shadow-sm border p-6 space-y-6">
                <h3 className="text-gray-800 font-bold flex items-center gap-2 text-lg">
                    <Brain className="text-violet-500" /> Wawasan AI Mediator
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Positive Signs */}
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                        <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-5 h-5" /> Kabar Baik
                        </h4>
                        <ul className="space-y-2">
                            {analysis?.positive_signs?.length ? analysis.positive_signs.map((sign, i) => (
                                <li key={i} className="flex items-start gap-3 text-emerald-900 text-sm">
                                    <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                    {sign}
                                </li>
                            )) : (
                                <li className="text-gray-400 italic text-sm">Tidak ditemukan tanda positif yang spesifik.</li>
                            )}
                        </ul>
                    </div>

                    {/* Potential Issues */}
                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                        <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5" /> Perlu Diperhatikan
                        </h4>
                        <ul className="space-y-2">
                            {analysis?.potential_issues?.length ? analysis.potential_issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-3 text-red-900 text-sm">
                                    <div className="mt-1 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                    {issue}
                                </li>
                            )) : (
                                <li className="text-gray-400 italic text-sm">Belum ada isu yang mengkhawatirkan.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* AI Tips for each user */}
                <div className="space-y-4 pt-2">
                    <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
                        <h4 className="font-bold text-violet-800 flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5" /> Pesan Mir'Ah AI untukmu
                        </h4>
                        <p className="text-violet-900 text-sm leading-relaxed italic">
                            "{analysis?.tip_for_a || 'Lanjutkan komunikasi yang sehat bersama pasanganmu.'}"
                        </p>
                    </div>

                    <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100">
                        <h4 className="font-bold text-pink-800 flex items-center gap-2 mb-3">
                            <HelpCircle className="w-5 h-5" /> Tip untuk Pasanganmu
                        </h4>
                        <p className="text-pink-900 text-sm leading-relaxed italic opacity-80">
                            "{analysis?.tip_for_b || 'Dukung pasanganmu dalam setiap langkah.'}"
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-violet-100 to-indigo-100 p-6 rounded-3xl text-center">
                <MessageCircle className="mx-auto text-violet-600 mb-2 w-8 h-8" />
                <h4 className="font-bold text-gray-800">Kunci Hubungan Sehat</h4>
                <p className="text-sm text-gray-600 mt-1">
                    Analisis ini berdasarkan pola percakapan kalian secara kolektif. Ingat, keterbukaan adalah yang utama.
                </p>
            </div>
        </div>
    );
};

export default MoodDashboard;
