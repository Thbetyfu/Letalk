const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export const API = {
    // Auth
    LOGIN: `${BASE_URL}/letalk/api/login/`,
    SIGNUP: `${BASE_URL}/letalk/api/signup/`,
    LOGOUT: `${BASE_URL}/letalk/api/logout/`,
    GET_USER: `${BASE_URL}/letalk/api/get-user/`,
    GOOGLE_SIGNIN: `${BASE_URL}/letalk/api/google-signin/`,
    REFRESH_TOKEN: `${BASE_URL}/letalk/api/refresh-token/`,

    // PIN
    FORGOT_PIN: `${BASE_URL}/letalk/api/forgot-pin/`,
    VERIFY_RESET_PIN: `${BASE_URL}/letalk/api/verify-reset-pin/`,
    CHANGE_PIN: `${BASE_URL}/letalk/api/change-pin/`,

    // Pairing
    PAIR_PARTNER: `${BASE_URL}/letalk/api/pair-partner/`,

    // Profile
    COMPLETE_GOOGLE_PROFILE: `${BASE_URL}/letalk/api/complete-google-profile/`,
    UPDATE_PROFILE: `${BASE_URL}/letalk/api/update-profile/`,

    // Relationship
    RELATIONSHIP_STATUS: `${BASE_URL}/letalk/api/relationship-status/`,
    BREAKUP: `${BASE_URL}/letalk/api/breakup/`,
    BREAKUP_STATUS: `${BASE_URL}/letalk/api/breakup-status/`,
    REQUEST_PATCHUP: `${BASE_URL}/letalk/api/request-patchup/`,

    // Chat
    SEND_MESSAGE: `${BASE_URL}/letalk/api/send-message/`,
    GET_MESSAGES: `${BASE_URL}/letalk/api/get-messages/`,

    // Gallery
    GALLERY: `${BASE_URL}/letalk/api/gallery/`,
    UPLOAD_PHOTO: `${BASE_URL}/letalk/api/upload-photo/`,
    EDIT_CAPTION: `${BASE_URL}/letalk/api/edit-caption/`,
    DELETE_PHOTO: `${BASE_URL}/letalk/api/delete-photo/`,
    TOGGLE_LIKE: `${BASE_URL}/letalk/api/toggle-like/`,

    // Notes
    NOTES: `${BASE_URL}/letalk/api/notes/`,
    NOTE_CREATE: `${BASE_URL}/letalk/api/notes/create/`,
    NOTE_DETAIL: (id: string) => `${BASE_URL}/letalk/api/notes/${id}/`,
    NOTE_DELETE: (id: string) => `${BASE_URL}/letalk/api/notes/${id}/delete/`,
    NOTE_FAVORITE: (id: string) => `${BASE_URL}/letalk/api/notes/${id}/favorite/`,

    // Reminders
    REMINDERS: `${BASE_URL}/letalk/api/reminders/`,
    REMINDER_CREATE: `${BASE_URL}/letalk/api/reminders/create/`,
    REMINDER_UPDATE: (id: string) => `${BASE_URL}/letalk/api/reminders/update/${id}/`,
    REMINDER_COMPLETE: (id: string) => `${BASE_URL}/letalk/api/reminders/complete/${id}/`,
    REMINDER_DELETE: (id: string) => `${BASE_URL}/letalk/api/reminders/delete/${id}/`,

    // Extras & Support
    EXTRAS: `${BASE_URL}/letalk/api/extras/`,
    LOVEJAR_ADD: `${BASE_URL}/letalk/api/extras/lovejar/add/`,
    LOVEJAR_REVEAL: (id: string) => `${BASE_URL}/letalk/api/extras/lovejar/reveal/${id}/`,
    LOVEJAR_DELETE: (id: string) => `${BASE_URL}/letalk/api/extras/lovejar/delete/${id}/`,
    TODO_ADD: `${BASE_URL}/letalk/api/extras/todo/add/`,
    TODO_TOGGLE: (id: string) => `${BASE_URL}/letalk/api/extras/todo/toggle/${id}/`,
    TODO_DELETE: (id: string) => `${BASE_URL}/letalk/api/extras/todo/delete/${id}/`,
    SUPPORT: `${BASE_URL}/letalk/api/support/`,

    // AI Personality & Profiling
    PERSONALITY_QUIZ: `${BASE_URL}/letalk/api/ai/personality-quiz/`,
    MOOD_DASHBOARD: `${BASE_URL}/letalk/api/ai/mood-dashboard/`,
    ANALYZE_CONVERSATION: `${BASE_URL}/letalk/api/ai/analyze-conversation/`,

    // WebSocket
    CHAT_WS: (pairCode: string) => {
        const token = getAuthToken();
        const base = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
        return `${base}/ws/chat/${pairCode}/?token=${token}`;
    },
};

// Helper: ambil token dari cookie
export const getAuthToken = (): string | undefined => {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('letalk='))
        ?.split('=')[1];
};

// Helper: set cookie token
export const setAuthToken = (token: string) => {
    document.cookie = `letalk=${token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
};

// Helper: hapus cookie token
export const clearAuthToken = () => {
    document.cookie = 'letalk=; path=/; max-age=0';
};

// Helper: auth headers
export const authHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json',
});
