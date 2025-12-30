import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaSearch, FaArrowRight, FaLayerGroup, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import registry from '../data/course_registry.json';

const CourseCatalog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [courses, setCourses] = useState(registry);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        const filtered = registry.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setCourses(filtered);
    }, [searchTerm]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="course-catalog">
            {/* Ambient Background */}
            <div className="ambient-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="pattern-overlay"></div>
            </div>

            <header className="catalog-header">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="title">Learning Library</h1>
                        <p className="subtitle-text">Master VFX & 3D Design with premium courses</p>
                    </motion.div>

                    <motion.div
                        className="search-wrapper"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find a course..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </motion.div>
                </div>
            </header>

            <div className="container main-content">
                <motion.div
                    className="courses-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence>
                        {courses.map(course => (
                            <motion.div
                                key={course.id}
                                variants={itemVariants}
                                layout
                            >
                                <Link to={`/course/${course.id}`} className="course-card">
                                    <div className="card-image-wrapper">
                                        <div className="card-image">
                                            {/* Gradient Thumbnail Placeholder */}
                                            <div
                                                className="placeholder-thumb"
                                                style={{
                                                    background: course.id === 'houdini-fx-19'
                                                        ? 'linear-gradient(135deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)'
                                                        : 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)'
                                                }}
                                            >
                                                <span className="course-initials">{course.title.substring(0, 2)}</span>
                                            </div>

                                            {course.thumbnail && !course.thumbnail.endsWith('.jpg') && (
                                                <img src={course.thumbnail} alt={course.title} onError={(e) => e.target.style.display = 'none'} />
                                            )}

                                            <div className="hover-overlay">
                                                <motion.button
                                                    className="play-btn"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <FaPlay /> Start Learning
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <div className="card-header">
                                            <h3>{course.title}</h3>
                                            <span className="badge">New</span>
                                        </div>
                                        <p className="course-subtitle">{course.subtitle}</p>
                                        <p className="description">{course.description}</p>

                                        <div className="card-footer">
                                            <div className="meta-item">
                                                <FaLayerGroup /> <span>Modules</span>
                                            </div>
                                            <div className="meta-item">
                                                <FaClock /> <span>Self-Paced</span>
                                            </div>
                                            <div className="action-arrow">
                                                <FaArrowRight />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {courses.length === 0 && (
                    <motion.div
                        className="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p>No courses found matching "{searchTerm}"</p>
                    </motion.div>
                )}
            </div>

            <style>{`
                :root {
                    --bg-dark: #050505;
                    --card-bg: rgba(255, 255, 255, 0.03);
                    --accent-primary: #3b82f6;
                    --text-primary: #ffffff;
                    --text-secondary: #a1a1aa;
                }

                .course-catalog {
                    min-height: 100vh;
                    background-color: var(--bg-dark);
                    color: var(--text-primary);
                    font-family: 'Inter', system-ui, sans-serif;
                    position: relative;
                    overflow-x: hidden;
                }

                /* Ambient Background */
                .ambient-bg {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    overflow: hidden;
                    z-index: 0;
                    pointer-events: none;
                }

                .blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.4;
                }

                .blob-1 {
                    top: -10%;
                    left: -10%;
                    width: 500px;
                    height: 500px;
                    background: #4f46e5;
                    animation: float 20s infinite ease-in-out;
                }

                .blob-2 {
                    bottom: -10%;
                    right: -10%;
                    width: 600px;
                    height: 600px;
                    background: #06b6d4;
                    animation: float 25s infinite ease-in-out reverse;
                }

                .pattern-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }

                @keyframes float {
                    0% { transform: translate(0, 0); }
                    50% { transform: translate(50px, 50px); }
                    100% { transform: translate(0, 0); }
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                    position: relative;
                    z-index: 1;
                }

                /* Header */
                .catalog-header {
                    padding: 120px 0 60px;
                    text-align: center;
                }

                .title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                    letter-spacing: -0.02em;
                    background: linear-gradient(to right, #fff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .subtitle-text {
                    font-size: 1.2rem;
                    color: var(--text-secondary);
                    margin-bottom: 40px;
                }

                /* Search Wrapper */
                .search-wrapper {
                    position: relative;
                    max-width: 500px;
                    margin: 0 auto;
                }

                .search-icon {
                    position: absolute;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                    z-index: 2;
                }

                input {
                    width: 100%;
                    padding: 16px 24px 16px 50px;
                    border-radius: 100px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    color: white;
                    font-size: 1.1rem;
                    transition: all 0.3s ease;
                    outline: none;
                }

                input:focus {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.3);
                    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
                }

                input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }

                /* Grid */
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 32px;
                    padding-bottom: 80px;
                }

                /* Card */
                .course-card {
                    display: flex;
                    flex-direction: column;
                    background: var(--card-bg);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    overflow: hidden;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    height: 100%;
                    backdrop-filter: blur(10px);
                }

                .course-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.06);
                }

                /* Card Thumb */
                .card-image-wrapper {
                    padding: 12px;
                }

                .card-image {
                    aspect-ratio: 16/9;
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                }

                .placeholder-thumb {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .course-initials {
                    font-size: 3.5rem;
                    font-weight: 800;
                    color: rgba(255,255,255,0.9);
                    letter-spacing: -0.05em;
                }

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                /* Hover Overlay */
                .hover-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    backdrop-filter: blur(2px);
                }

                .course-card:hover .hover-overlay {
                    opacity: 1;
                }

                .play-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 24px;
                    background: white;
                    color: black;
                    border: none;
                    border-radius: 100px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                }

                /* Card Content */
                .card-content {
                    padding: 4px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }

                h3 {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: white;
                    line-height: 1.3;
                }

                .badge {
                    font-size: 0.7rem;
                    padding: 4px 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 6px;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }

                .course-subtitle {
                    color: var(--accent-primary);
                    font-size: 0.95rem;
                    font-weight: 500;
                    margin: 0 0 16px 0;
                }

                .description {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Footer */
                .card-footer {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-right: 20px;
                }

                .action-arrow {
                    margin-left: auto;
                    opacity: 0;
                    transform: translateX(-10px);
                    transition: all 0.3s ease;
                    color: white;
                }

                .course-card:hover .action-arrow {
                    opacity: 1;
                    transform: translateX(0);
                }

                .no-results {
                    text-align: center;
                    padding: 80px 0;
                    color: var(--text-secondary);
                    font-size: 1.2rem;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .title {
                        font-size: 2.5rem;
                    }
                    
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }

                    .catalog-header {
                        padding: 80px 0 40px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CourseCatalog;
