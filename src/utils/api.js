const API_BASE_URL = 'http://localhost:3001/api';

export const getUserId = () => {
    let userId = localStorage.getItem('houdini_user_id');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('houdini_user_id', userId);
    }
    return userId;
};

export const syncUserData = async () => {
    const userId = getUserId();
    try {
        const response = await fetch(`${API_BASE_URL}/sync/${userId}`);
        if (!response.ok) throw new Error('Sync failed');
        return await response.json();
    } catch (error) {
        console.error('API Sync Error:', error);
        return null; // Fallback to local
    }
};

export const updateProgress = async (lessonId, isCompleted, position) => {
    const userId = getUserId();
    try {
        await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lessonId, isCompleted, position })
        });
    } catch (error) {
        console.error('API Progress Error:', error);
    }
};

export const saveNote = async (lessonId, content) => {
    const userId = getUserId();
    try {
        await fetch(`${API_BASE_URL}/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lessonId, content })
        });
    } catch (error) {
        console.error('API Note Error:', error);
    }
};
