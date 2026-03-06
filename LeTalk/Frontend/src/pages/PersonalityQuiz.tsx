import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, getAuthToken } from '../config/api';
import {
    Heart, MessageCircle, Shield, Sparkles, ChevronRight, ChevronLeft,
    CheckCircle, ArrowRight, Star, Zap, Eye, Users, Brain
} from 'lucide-react';

interface QuizQuestion {
    id: number;
    question: string;
    category: string;
    options: { label: string; value: string }[];
}

interface PersonalityProfile {
    personality_type: string;
    communication_style: string;
    conflict_handling: string;
    love_language: string;
    emotional_sensitivity: number;
    empathy_level: number;
    patience_level: number;
    summary: string;
    strengths: string[];
    growth_areas: string[];
}

const questions: QuizQuestion[] = [
    {
        id: 1,
        question: 'Ketika pasanganmu sedang marah, kamu biasanya...',
        category: 'Conflict Handling',
        options: [
            { label: 'Diam dan memberi ruang sampai tenang', value: 'give_space' },
            { label: 'Langsung ajak bicara untuk selesaikan masalah', value: 'confront' },
            { label: 'Coba rayu dan buat suasana lebih baik', value: 'lighten_mood' },
            { label: 'Merasa cemas dan ikut emosi', value: 'anxious' },
        ],
    },
    {
        id: 2,
        question: 'Cara kamu menunjukkan rasa sayang paling sering adalah...',
        category: 'Love Language',
        options: [
            { label: 'Mengucapkan kata-kata manis dan pujian', value: 'words_of_affirmation' },
            { label: 'Menghabiskan waktu bersama tanpa distraksi', value: 'quality_time' },
            { label: 'Memberikan hadiah atau kejutan kecil', value: 'gifts' },
            { label: 'Membantu pekerjaan atau tugas pasangan', value: 'acts_of_service' },
        ],
    },
    {
        id: 3,
        question: 'Ketika ada masalah, kamu lebih suka...',
        category: 'Communication Style',
        options: [
            { label: 'Langsung TO THE POINT membahas masalahnya', value: 'direct' },
            { label: 'Secara halus menyinggung perlahan', value: 'indirect' },
            { label: 'Menulis pesan panjang agar lebih terstruktur', value: 'written' },
            { label: 'Diam dulu, baru bicara kalau sudah tenang', value: 'delayed' },
        ],
    },
    {
        id: 4,
        question: 'Kamu merasa paling dihargai ketika...',
        category: 'Love Language',
        options: [
            { label: 'Pasangan memuji usaha dan kebaikanmu', value: 'praised' },
            { label: 'Pasangan meluangkan waktu penuh untukmu', value: 'time_together' },
            { label: 'Pasangan memberikan pelukan atau sentuhan', value: 'physical_touch' },
            { label: 'Pasangan membantu tanpa diminta', value: 'helped' },
        ],
    },
    {
        id: 5,
        question: 'Saat pertengkaran, kamu cenderung...',
        category: 'Conflict Handling',
        options: [
            { label: 'Mencari kompromi dan jalan tengah', value: 'compromising' },
            { label: 'Mempertahankan pendapat dengan argumen logis', value: 'competitive' },
            { label: 'Mengalah demi menjaga keharmonisan', value: 'accommodating' },
            { label: 'Menghindari dan berharap masalah selesai sendiri', value: 'avoidant' },
        ],
    },
    {
        id: 6,
        question: 'Seberapa mudah kamu merasa tersinggung?',
        category: 'Emotional Sensitivity',
        options: [
            { label: 'Sangat mudah — hal kecil bisa membuat sedih', value: 'very_sensitive' },
            { label: 'Cukup sensitif — tergantung situasinya', value: 'moderate' },
            { label: 'Jarang tersinggung — cukup tebal kulit', value: 'rarely' },
            { label: 'Hampir tidak pernah — santai saja', value: 'not_sensitive' },
        ],
    },
    {
        id: 7,
        question: 'Ketika pasangan melakukan kesalahan kecil...',
        category: 'Patience Level',
        options: [
            { label: 'Langsung maafkan dan lupakan', value: 'very_patient' },
            { label: 'Maafkan tapi tetap ingatkan dengan baik', value: 'patient_reminder' },
            { label: 'Agak kesal tapi bisa sabar', value: 'moderate_patience' },
            { label: 'Cukup frustrasi dan perlu waktu menenangkan diri', value: 'less_patient' },
        ],
    },
    {
        id: 8,
        question: 'Kamu lebih nyaman berkomunikasi...',
        category: 'Communication Style',
        options: [
            { label: 'Secara langsung (face to face)', value: 'face_to_face' },
            { label: 'Lewat chat/pesan (lebih banyak waktu berpikir)', value: 'text_based' },
            { label: 'Campuran — tergantung topiknya', value: 'mixed' },
            { label: 'Lebih suka menunjukkan lewat tindakan daripada bicara', value: 'action_based' },
        ],
    },
    {
        id: 9,
        question: 'Setelah pertengkaran, kamu biasanya...',
        category: 'Conflict Resolution',
        options: [
            { label: 'Langsung minta maaf dan pelukan', value: 'immediate_reconcile' },
            { label: 'Butuh waktu sendiri dulu baru bisa bicara', value: 'need_time' },
            { label: 'Menulis pesan panjang yang menjelaskan perasaan', value: 'write_feelings' },
            { label: 'Bersikap normal seolah tidak terjadi apa-apa', value: 'act_normal' },
        ],
    },
    {
        id: 10,
        question: 'Hal yang paling penting dalam hubungan bagimu...',
        category: 'Values',
        options: [
            { label: 'Kepercayaan dan kejujuran', value: 'trust' },
            { label: 'Komunikasi yang terbuka', value: 'communication' },
            { label: 'Quality time bersama', value: 'togetherness' },
            { label: 'Dukungan dan pengertian', value: 'support' },
        ],
    },
    {
        id: 11,
        question: 'Ketika stres, kamu...',
        category: 'Coping Style',
        options: [
            { label: 'Cerita ke pasangan untuk meringankan beban', value: 'share' },
            { label: 'Menyendiri dan refleksi diri', value: 'alone_time' },
            { label: 'Mencari distraksi (main game, nonton, dll)', value: 'distraction' },
            { label: 'Olahraga atau aktivitas fisik', value: 'physical_activity' },
        ],
    },
    {
        id: 12,
        question: 'Kamu mendeskripsikan dirimu sebagai...',
        category: 'Self Awareness',
        options: [
            { label: 'Si Penyayang — selalu mengutamakan perasaan orang lain', value: 'caregiver' },
            { label: 'Si Pemikir — logis dan analitis', value: 'thinker' },
            { label: 'Si Petualang — spontan dan penuh energi', value: 'adventurer' },
            { label: 'Si Penyeimbang — harmonis dan dipercaya', value: 'harmonizer' },
        ],
    },
];

const loveLanguageIcons: Record<string, string> = {
    words_of_affirmation: '💬',
    quality_time: '⏰',
    physical_touch: '🤗',
    acts_of_service: '🤝',
    gifts: '🎁',
};

const PersonalityQuiz: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState<PersonalityProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const progress = ((currentStep) / questions.length) * 100;
    const currentQ = questions[currentStep];
    const isLastQuestion = currentStep === questions.length - 1;
    const allAnswered = Object.keys(answers).length === questions.length;

    const handleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
        if (!isLastQuestion) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const token = getAuthToken();
            const formattedAnswers: Record<string, string> = {};
            questions.forEach(q => {
                formattedAnswers[q.question] = answers[q.id] || '';
            });

            const res = await fetch(API.PERSONALITY_QUIZ, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({ answers: formattedAnswers }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Gagal menganalisis kepribadian');
            }

            const data = await res.json();
            setProfile(data.profile);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMeterColor = (value: number) => {
        if (value >= 8) return 'from-emerald-400 to-emerald-600';
        if (value >= 6) return 'from-violet-400 to-violet-600';
        if (value >= 4) return 'from-amber-400 to-amber-600';
        return 'from-rose-400 to-rose-600';
    };

    // ─── LOADING / SUBMITTING STATE ───
    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-violet-100">
                    <div className="relative mx-auto w-20 h-20 mb-6">
                        <div className="absolute inset-0 bg-violet-200 rounded-full animate-ping opacity-30" />
                        <div className="relative bg-gradient-to-br from-violet-500 to-pink-500 rounded-full w-20 h-20 flex items-center justify-center">
                            <Brain className="w-10 h-10 text-white animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Menganalisis Kepribadianmu...</h2>
                    <p className="text-gray-500 mb-6">Mir'Ah AI sedang memproses jawaban quizmu</p>
                    <div className="flex justify-center gap-1">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-3 h-3 bg-violet-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── RESULT STATE ───
    if (profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-indigo-50 py-8 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-violet-100 text-center">
                        <div className="bg-gradient-to-br from-violet-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            {profile.personality_type}
                        </h1>
                        <p className="text-gray-600 leading-relaxed">{profile.summary}</p>
                    </div>

                    {/* Traits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 border border-pink-100 text-center">
                            <Heart className="w-7 h-7 text-pink-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Love Language</p>
                            <p className="font-bold text-gray-800 capitalize">
                                {loveLanguageIcons[profile.love_language] || '💕'} {profile.love_language?.replace(/_/g, ' ')}
                            </p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 border border-violet-100 text-center">
                            <MessageCircle className="w-7 h-7 text-violet-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Communication</p>
                            <p className="font-bold text-gray-800 capitalize">{profile.communication_style}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 border border-indigo-100 text-center">
                            <Shield className="w-7 h-7 text-indigo-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Conflict Style</p>
                            <p className="font-bold text-gray-800 capitalize">{profile.conflict_handling}</p>
                        </div>
                    </div>

                    {/* Meters */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-violet-100">
                        <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" /> Profil Emosional
                        </h3>
                        {[
                            { label: 'Empathy', value: profile.empathy_level, icon: <Users className="w-4 h-4" /> },
                            { label: 'Patience', value: profile.patience_level, icon: <Eye className="w-4 h-4" /> },
                            { label: 'Sensitivity', value: profile.emotional_sensitivity, icon: <Heart className="w-4 h-4" /> },
                        ].map((meter) => (
                            <div key={meter.label} className="mb-4 last:mb-0">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        {meter.icon} {meter.label}
                                    </span>
                                    <span className="text-sm font-bold text-violet-600">{meter.value}/10</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(meter.value)} transition-all duration-1000 ease-out`}
                                        style={{ width: `${meter.value * 10}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Strengths & Growth */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 border border-emerald-100">
                            <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Kekuatanmu
                            </h3>
                            <ul className="space-y-2">
                                {profile.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-emerald-500 mt-0.5">✅</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 border border-amber-100">
                            <h3 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                                <Star className="w-5 h-5" /> Area Pengembangan
                            </h3>
                            <ul className="space-y-2">
                                {profile.growth_areas.map((g, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-amber-500 mt-0.5">🔶</span> {g}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={() => navigate('/dashboard/chat')}
                        className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        Mulai Chat <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // ─── QUIZ STATE ───
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-violet-600">
                            Pertanyaan {currentStep + 1} dari {questions.length}
                        </span>
                        <span className="text-sm text-gray-500">{currentQ.category}</span>
                    </div>
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-violet-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                        {currentQ.question}
                    </h2>

                    <div className="space-y-3">
                        {currentQ.options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleAnswer(option.value)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm
                  ${answers[currentQ.id] === option.value
                                        ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-md shadow-violet-100'
                                        : 'border-gray-100 bg-white hover:border-violet-300 hover:bg-violet-50/50 text-gray-700'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                            {error}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                            disabled={currentStep === 0}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>

                        {isLastQuestion && allAnswered ? (
                            <button
                                onClick={handleSubmit}
                                className="bg-gradient-to-r from-violet-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" /> Analisis Kepribadian
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(prev => Math.min(questions.length - 1, prev + 1))}
                                disabled={!answers[currentQ.id]}
                                className="flex items-center gap-1 text-sm text-violet-600 font-medium hover:text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-1.5 mt-6">
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { if (answers[questions[i].id] || i <= currentStep) setCurrentStep(i); }}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentStep
                                ? 'bg-violet-600 scale-125'
                                : answers[questions[i].id]
                                    ? 'bg-violet-300'
                                    : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonalityQuiz;
