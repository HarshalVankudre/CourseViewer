import React, { useState } from 'react';
import { saveNote } from '../utils/api';

const TextLesson = ({ lesson, onComplete, isCompleted, initialNote }) => {
    const [noteContent, setNoteContent] = useState(initialNote || '');
    return (
        <div className="text-lesson-container" style={{ padding: '40px', color: '#e0e0e0', maxWidth: '800px', margin: '0 auto' }}>
            <div className="lesson-header" style={{ marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>{lesson.title}</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--accent-color)', color: '#fff' }}>
                        {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                </div>
            </div>

            <div className="lesson-content" style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '30px',
                borderRadius: '12px',
                lineHeight: '1.8',
                fontSize: '1.1rem'
            }}>
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />

                {lesson.resources && lesson.resources.length > 0 && (
                    <div className="resources-list" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Downloads</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {lesson.resources.map((res, index) => (
                                <a
                                    key={index}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px 20px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        transition: 'background 0.2s',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>📦</span>
                                    <span>{res.title}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase' }}>{res.type}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Notes Section */}
            <div className="notes-section" style={{ marginTop: '30px' }}>
                <h3>Notes (Auto-saved)</h3>
                <textarea
                    placeholder="Take notes for this lesson..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onBlur={() => {
                        saveNote(lesson.url || lesson.filename, noteContent);
                    }}
                    style={{
                        width: '100%',
                        height: '150px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        marginTop: '10px',
                        resize: 'none'
                    }}
                />
            </div>

            <div className="action-area" style={{ marginTop: '40px', textAlign: 'center' }}>
                <button
                    onClick={onComplete}
                    style={{
                        padding: '12px 30px',
                        background: 'var(--accent-color)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        opacity: isCompleted ? 0.7 : 1
                    }}
                >
                    {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                </button>
            </div>
        </div>
    );
};

export default TextLesson;
