import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import VideoPlayer from './VideoPlayer';
import TextLesson from './TextLesson';
import { FaBars, FaArrowLeft } from 'react-icons/fa';

// API utilities
import { getUserId, syncUserData, updateProgress } from '../utils/api';

const Layout = ({ courseConfig }) => {
    const navigate = useNavigate();

    const [courseData, setCourseData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [completedLessons, setCompletedLessons] = useState({});
    const [progressData, setProgressData] = useState({});
    const [notes, setNotes] = useState({});
    const [bookmarkedLessons, setBookmarkedLessons] = useState({});

    // Flatten all lessons for lookup (memoized to avoid recalculating)
    const allLessonsFlat = useMemo(() =>
        courseData.reduce((acc, chapter) => [...acc, ...chapter.lessons], []),
        [courseData]
    );

    // Find a lesson by URL or filename
    const findLessonByKey = (key) => {
        return allLessonsFlat.find(l => l.url === key || l.filename === key);
    };

    // Load course data from remote URL (GCP bucket)
    useEffect(() => {
        const loadCourseData = async () => {
            try {
                setIsLoading(true);
                // CourseViewer prepares the full URL for courseDataPath
                // Add cache-busting to force fresh load
                const dataUrl = `${courseConfig.courseDataPath}?v=${Date.now()}`;
                const response = await fetch(dataUrl, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Failed to load course data: ${response.status}`);
                const data = await response.json();
                setCourseData(data);
                setLoadError(null);
            } catch (error) {
                console.error('Failed to load course data:', error);
                setLoadError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadCourseData();
    }, []);

    // Load user progress after course data is loaded
    useEffect(() => {
        if (courseData.length === 0) return;

        const initializeData = async () => {
            // Local fallback first (immediate)
            const storagePrefix = `${courseConfig.courseId}_`;
            const localCompleted = JSON.parse(localStorage.getItem(`${storagePrefix}completed`)) || {};
            const localNotes = JSON.parse(localStorage.getItem(`${storagePrefix}notes`)) || {};
            const localProgress = JSON.parse(localStorage.getItem(`${storagePrefix}progress`)) || {};
            const localBookmarks = JSON.parse(localStorage.getItem(`${storagePrefix}bookmarks`)) || {};
            setCompletedLessons(localCompleted);
            setNotes(localNotes);
            setProgressData(localProgress);
            setBookmarkedLessons(localBookmarks);

            // Try API Sync (may take a moment)
            const apiData = await syncUserData();
            if (apiData) {
                // Merge: API data takes precedence
                setCompletedLessons(prev => ({ ...prev, ...apiData.completed }));
                setNotes(prev => ({ ...prev, ...apiData.notes }));
                if (apiData.progressMap) {
                    setProgressData(prev => ({ ...prev, ...apiData.progressMap }));
                }
            }

            // Restore last watched lesson from localStorage
            const lastWatchedKey = localStorage.getItem(`${storagePrefix}last_lesson`);
            if (lastWatchedKey) {
                const lastLesson = allLessonsFlat.find(l => l.url === lastWatchedKey || l.filename === lastWatchedKey);
                if (lastLesson) {
                    setCurrentLesson(lastLesson);
                    return; // Don't set default if restored
                }
            }

            // Set first lesson as default if none selected and no saved lesson
            if (courseData.length > 0 && courseData[0].lessons.length > 0) {
                setCurrentLesson(courseData[0].lessons[0]);
            }
        };

        initializeData();
    }, [courseData, allLessonsFlat]);

    const toggleComplete = (lessonId) => {
        const isCompleted = !completedLessons[lessonId];
        const newCompleted = { ...completedLessons, [lessonId]: isCompleted };
        setCompletedLessons(newCompleted);
        localStorage.setItem(`${courseConfig.courseId}_completed`, JSON.stringify(newCompleted));

        // API Update
        const currentPos = progressData[lessonId]?.position || 0;
        updateProgress(lessonId, isCompleted, currentPos);
    };

    // Mark as complete (for auto-completion when video ends)
    const markComplete = (lessonId) => {
        if (!completedLessons[lessonId]) {
            const newCompleted = { ...completedLessons, [lessonId]: true };
            setCompletedLessons(newCompleted);
            localStorage.setItem(`${courseConfig.courseId}_completed`, JSON.stringify(newCompleted));
            updateProgress(lessonId, true, 0);
        }
    };

    // Toggle bookmark for a lesson
    const toggleBookmark = (lessonId) => {
        const isBookmarked = !bookmarkedLessons[lessonId];
        const newBookmarks = { ...bookmarkedLessons, [lessonId]: isBookmarked };
        if (!isBookmarked) delete newBookmarks[lessonId];
        setBookmarkedLessons(newBookmarks);
        localStorage.setItem(`${courseConfig.courseId}_bookmarks`, JSON.stringify(newBookmarks));
    };

    const handleProgressUpdate = (lessonId, position) => {
        // Update local state
        setProgressData(prev => ({
            ...prev,
            [lessonId]: { ...prev[lessonId], position }
        }));

        // Also save to localStorage immediately for instant refresh persistence
        const localProgress = JSON.parse(localStorage.getItem(`${courseConfig.courseId}_progress`)) || {};
        localProgress[lessonId] = { position };
        localStorage.setItem(`${courseConfig.courseId}_progress`, JSON.stringify(localProgress));
    };

    // Calculate course progress
    const totalLessons = allLessonsFlat.length;
    const completedCount = Object.keys(completedLessons).filter(k => completedLessons[k]).length;
    const courseProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Save current lesson to localStorage and update browser tab title
    useEffect(() => {
        if (currentLesson) {
            const key = currentLesson.url || currentLesson.filename;
            localStorage.setItem(`${courseConfig.courseId}_last_lesson`, key);

            // Update browser tab title
            document.title = `${currentLesson.title} | ${courseConfig.courseName}`;
        } else {
            document.title = `${courseConfig.courseName} ${courseConfig.courseSubtitle || ''}`;
        }
    }, [currentLesson]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Flatten lessons for navigation
    const allLessons = courseData.reduce((acc, chapter) => [...acc, ...chapter.lessons], []);
    const currentIndex = allLessons.findIndex(l => l.url === currentLesson?.url || l.filename === currentLesson?.filename);

    const goToNext = () => {
        if (currentIndex < allLessons.length - 1) {
            setCurrentLesson(allLessons[currentIndex + 1]);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentLesson(allLessons[currentIndex - 1]);
        }
    };

    // Preload next lesson's video for instant playback
    useEffect(() => {
        if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentIndex + 1];
            if (nextLesson?.url && nextLesson.type !== 'text') {
                // Create preload link for next video
                const existingPreload = document.getElementById('next-video-preload');
                if (existingPreload) existingPreload.remove();

                const link = document.createElement('link');
                link.id = 'next-video-preload';
                link.rel = 'preload';
                link.as = 'fetch';
                link.crossOrigin = 'anonymous';
                link.href = nextLesson.url;
                document.head.appendChild(link);
            }
        }
        return () => {
            const existingPreload = document.getElementById('next-video-preload');
            if (existingPreload) existingPreload.remove();
        };
    }, [currentIndex, allLessons]);

    // Loading state
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div className="loading-spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTop: '3px solid var(--accent-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading course...</p>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px'
            }}>
                <h2 style={{ color: '#ef4444' }}>Failed to Load Course</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{loadError}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--accent-color)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={`app-container ${!isSidebarOpen ? 'theater-mode' : ''}`}>
            <Sidebar
                isOpen={isSidebarOpen}
                courseData={courseData}
                currentLesson={currentLesson}
                completedLessons={completedLessons}
                bookmarkedLessons={bookmarkedLessons}
                onSelectLesson={setCurrentLesson}
                onToggleComplete={toggleComplete}
                onToggleBookmark={toggleBookmark}
                courseProgress={courseProgress}
                completedCount={completedCount}
                totalLessons={totalLessons}
                courseName={courseConfig.courseName}
            />

            <main className="main-content" style={{ position: 'relative', paddingTop: '80px' }}>
                <button
                    className="toggle-sidebar-btn"
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: isSidebarOpen ? '340px' : '20px',
                        zIndex: 1000,
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)',
                        transition: 'left 0.3s ease'
                    }}
                >
                    <FaBars />
                </button>

                {/* Back to Catalog Button */}
                <button
                    className="back-btn"
                    onClick={() => navigate('/')}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: isSidebarOpen ? '400px' : '80px', // Shifted right of toggle button
                        zIndex: 1000,
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        color: 'white',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'left 0.3s ease'
                    }}
                    title="Back to Catalog"
                >
                    <FaArrowLeft /> Catalog
                </button>

                {currentLesson ? (
                    currentLesson.type === 'text' ? (
                        <TextLesson
                            lesson={currentLesson}
                            onComplete={() => toggleComplete(currentLesson.filename)} // Use filename as unique ID similar to URL
                            isCompleted={!!completedLessons[currentLesson.filename]}
                            initialNote={notes[currentLesson.filename] || ''}
                        // Could add nav buttons here too
                        />
                    ) : (
                        <VideoPlayer
                            lesson={currentLesson}
                            onComplete={() => markComplete(currentLesson.url)}
                            onToggleComplete={() => toggleComplete(currentLesson.url)}
                            isCompleted={!!completedLessons[currentLesson.url]}
                            initialTime={progressData[currentLesson.url]?.position || 0}
                            initialNote={notes[currentLesson.url] || ''}
                            onProgressUpdate={(pos) => handleProgressUpdate(currentLesson.url, pos)}
                            onNextLesson={currentIndex < allLessons.length - 1 ? goToNext : null}
                            onPrevLesson={currentIndex > 0 ? goToPrev : null}
                            onVideoEnd={() => {
                                markComplete(currentLesson.url);
                                if (currentIndex < allLessons.length - 1) {
                                    setTimeout(() => goToNext(), 1500); // Auto-next after short delay
                                }
                            }}
                            isBookmarked={!!bookmarkedLessons[currentLesson.url]}
                            onToggleBookmark={() => toggleBookmark(currentLesson.url)}
                        />
                    )
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h2>Select a lesson to start</h2>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Layout;
