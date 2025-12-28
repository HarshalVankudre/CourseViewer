/**
 * Course Configuration
 * 
 * Edit this file to configure your course.
 * All course-specific settings are centralized here.
 */

const courseConfig = {
    // ===== BASIC INFO =====
    courseId: 'houdini-fx-19',           // Unique ID (used for localStorage, no spaces)
    courseName: 'Houdini FX 19',          // Display name in sidebar header
    courseSubtitle: 'Complete Bootcamp',  // Optional subtitle

    // ===== THEMING =====
    accentColor: '#3b82f6',               // Primary accent color (CSS color)
    faviconEmoji: '🔥',                   // Emoji for favicon (or path to .svg/.ico)

    // ===== CONTENT SOURCE =====
    // GCP bucket base URL for video content
    contentBaseUrl: 'https://storage.googleapis.com/houdini-fx-assets-omega-479214',

    // Path to course data JSON (relative to public folder or full URL)
    courseDataPath: '/src/data/course_data.json',

    // ===== FEATURES =====
    enableSubtitles: true,
    enableNotes: true,
    enableBookmarks: true,
    enableAutoNext: true,                 // Auto-play next lesson when video ends
    autoNextDelay: 1500,                  // Delay in ms before auto-next

    // ===== PROGRESS SAVING =====
    // How often to save progress (in seconds)
    progressSaveInterval: 15,

    // ===== BRANDING =====
    logoUrl: null,                        // Path to logo image (optional)
    footerText: null,                     // Footer text (optional)
};

export default courseConfig;
