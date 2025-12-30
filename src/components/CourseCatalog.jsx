import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaSearch } from 'react-icons/fa';
import registry from '../data/course_registry.json';

const CourseCatalog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [courses, setCourses] = useState(registry);

    useEffect(() => {
        const filtered = registry.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setCourses(filtered);
    }, [searchTerm]);

    return (
        <div className="course-catalog">
            <header className="catalog-header">
                <div className="container">
                    <h1>My Learning Library</h1>
                    <div className="search-bar">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="courses-grid">
                    {courses.map(course => (
                        <Link to={`/course/${course.id}`} key={course.id} className="course-card">
                            <div className="card-image">
                                <div className="placeholder-thumb" style={{ background: `linear-gradient(45deg, ${course.id === 'houdini-fx-19' ? '#3b82f6, #8b5cf6' : '#10b981, #3b82f6'})` }}>
                                    <span>{course.title.substring(0, 2)}</span>
                                </div>
                                {/* Use actual thumbnail if valid URL, otherwise fallback is handled by CSS/Layout if needed, generic here */}
                                {course.thumbnail && !course.thumbnail.endsWith('.jpg') && (
                                    <img src={course.thumbnail} alt={course.title} onError={(e) => e.target.style.display = 'none'} />
                                )}
                                <div className="play-overlay">
                                    <FaPlay />
                                </div>
                            </div>
                            <div className="card-content">
                                <h3>{course.title}</h3>
                                <p className="subtitle">{course.subtitle}</p>
                                <p className="description">{course.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {courses.length === 0 && (
                    <div className="no-results">
                        <p>No courses found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>

            <style>{`
                .course-catalog {
                    min-height: 100vh;
                    background-color: var(--bg-primary, #0a0a0a);
                    color: white;
                    font-family: 'Inter', sans-serif;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .catalog-header {
                    padding: 60px 0 40px;
                    text-align: center;
                    background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 40px;
                }

                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 30px;
                    background: linear-gradient(to right, #fff, #aaa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .search-bar {
                    position: relative;
                    max-width: 500px;
                    margin: 0 auto;
                }

                .search-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                }

                input {
                    width: 100%;
                    padding: 12px 20px 12px 45px;
                    border-radius: 25px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: white;
                    font-size: 1rem;
                    transition: all 0.2s;
                    outline: none;
                }

                input:focus {
                    background: rgba(255,255,255,0.1);
                    border-color: var(--accent-color, #3b82f6);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }

                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 30px;
                    padding-bottom: 60px;
                }

                .course-card {
                    background: #1a1a1a;
                    border-radius: 12px;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    flex-direction: column;
                }

                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    border-color: rgba(255,255,255,0.1);
                }

                .card-image {
                    aspect-ratio: 16/9;
                    background: #222;
                    position: relative;
                    overflow: hidden;
                }

                .placeholder-thumb {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.2);
                }

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .play-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .play-overlay svg {
                    font-size: 3rem;
                    color: white;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }

                .course-card:hover .play-overlay {
                    opacity: 1;
                }

                .card-content {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                h3 {
                    margin: 0 0 5px 0;
                    font-size: 1.2rem;
                    color: white;
                }

                .subtitle {
                    color: var(--accent-color, #3b82f6);
                    font-size: 0.9rem;
                    margin: 0 0 15px 0;
                    font-weight: 500;
                }

                .description {
                    color: #aaa;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin: 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .no-results {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};

export default CourseCatalog;
