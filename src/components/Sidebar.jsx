import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaCheckCircle, FaCircle, FaBookmark, FaRegBookmark } from 'react-icons/fa';

const Sidebar = ({
    isOpen,
    courseData,
    currentLesson,
    completedLessons,
    bookmarkedLessons = {},
    onSelectLesson,
    onToggleComplete,
    onToggleBookmark,
    courseProgress = 0,
    completedCount = 0,
    totalLessons = 0,
    courseName = 'Course'
}) => {
    const [expandedChapters, setExpandedChapters] = useState({});

    const toggleChapter = (chapterTitle) => {
        setExpandedChapters(prev => ({
            ...prev,
            [chapterTitle]: !prev[chapterTitle]
        }));
    };

    return (
        <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            {/* Header with Course Progress */}
            <div className="sidebar-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '12px' }}>{courseName}</h2>

                {/* Progress Bar */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                    }}>
                        <span>{completedCount} / {totalLessons} completed</span>
                        <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{courseProgress}%</span>
                    </div>
                    <div style={{
                        height: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${courseProgress}%`,
                            background: 'linear-gradient(90deg, var(--accent-color), #22c55e)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            </div>

            <div className="sidebar-content" style={{ overflowY: 'auto', flex: 1 }}>
                {courseData.map((chapter) => (
                    <div key={chapter.title} className="chapter-item">
                        <div
                            className="chapter-header"
                            onClick={() => toggleChapter(chapter.title)}
                            style={{
                                padding: '15px 20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.03)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{chapter.title}</span>
                            {expandedChapters[chapter.title] ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                        </div>

                        {expandedChapters[chapter.title] && (
                            <div className="lesson-list">
                                {chapter.lessons.map((lesson) => {
                                    const lessonKey = lesson.url || lesson.filename;
                                    const isSelected = currentLesson && (currentLesson.url === lesson.url || currentLesson.filename === lesson.filename);
                                    const isCompleted = completedLessons[lessonKey];
                                    const isBookmarked = bookmarkedLessons[lessonKey];

                                    return (
                                        <div
                                            key={lessonKey}
                                            className={`lesson-item ${isSelected ? 'active' : ''}`}
                                            style={{
                                                padding: '10px 20px 10px 30px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                fontSize: '0.85rem',
                                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                                background: isSelected ? 'var(--accent-glow)' : 'transparent',
                                                borderLeft: isSelected ? '3px solid var(--accent-color)' : '3px solid transparent',
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Completion checkbox */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onToggleComplete) onToggleComplete(lessonKey);
                                                }}
                                                style={{
                                                    minWidth: '18px',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s'
                                                }}
                                                title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                                            >
                                                {isCompleted ?
                                                    <FaCheckCircle color="var(--accent-color)" size={16} /> :
                                                    <FaCircle color="#444" size={14} style={{ opacity: 0.5 }} />
                                                }
                                            </div>

                                            {/* Lesson title */}
                                            <span
                                                onClick={() => onSelectLesson(lesson)}
                                                style={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    textDecoration: isCompleted ? 'none' : 'none',
                                                    opacity: isCompleted ? 0.8 : 1
                                                }}
                                            >
                                                {lesson.title}
                                            </span>

                                            {/* Bookmark button */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onToggleBookmark) onToggleBookmark(lessonKey);
                                                }}
                                                style={{
                                                    cursor: 'pointer',
                                                    opacity: isBookmarked ? 1 : 0.3,
                                                    transition: 'opacity 0.2s, transform 0.2s'
                                                }}
                                                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
                                            >
                                                {isBookmarked ?
                                                    <FaBookmark color="#f59e0b" size={12} /> :
                                                    <FaRegBookmark size={12} />
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
