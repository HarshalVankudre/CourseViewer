import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    FaPlay,
    FaSearch,
    FaArrowRight,
    FaLayerGroup,
    FaClock,
    FaTimes,
    FaGraduationCap,
    FaStar,
    FaFire
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import registry from '../data/course_registry.json';

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 40, opacity: 0, scale: 0.95 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 }
    },
    exit: {
        y: -20,
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

const headerVariants = {
    hidden: { opacity: 0, y: -40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

// ============================================
// GRADIENT PRESETS
// ============================================
const GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

// ============================================
// SKELETON LOADING COMPONENT
// ============================================
const SkeletonCard = () => (
    <div className="course-card skeleton-card">
        <div className="card-image-wrapper">
            <div className="skeleton-image" />
        </div>
        <div className="card-content">
            <div className="skeleton-line title-line" />
            <div className="skeleton-line subtitle-line" />
            <div className="skeleton-line text-line" />
            <div className="skeleton-line text-line short" />
            <div className="skeleton-footer">
                <div className="skeleton-meta" />
                <div className="skeleton-meta" />
            </div>
        </div>
    </div>
);

// ============================================
// COURSE CARD COMPONENT
// ============================================
const CourseCard = React.memo(({ course, index }) => {
    const gradient = GRADIENTS[index % GRADIENTS.length];

    return (
        <motion.article variants={itemVariants} layout>
            <Link
                to={`/course/${course.id}`}
                className="course-card"
                aria-label={`View ${course.title} course`}
            >
                {/* Image Section */}
                <div className="card-image-wrapper">
                    <div className="card-image">
                        <div
                            className="gradient-bg"
                            style={{ background: gradient }}
                        >
                            <div className="course-icon-wrapper">
                                <FaGraduationCap className="course-icon" />
                            </div>
                            <div className="gradient-pattern" />
                        </div>

                        {course.thumbnail && !course.thumbnail.endsWith('.jpg') && (
                            <img
                                src={course.thumbnail}
                                alt=""
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}

                        {/* Badges */}
                        <div className="badge-container">
                            <span className="badge badge-new">
                                <FaFire /> New
                            </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="hover-overlay">
                            <motion.span
                                className="play-btn"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FaPlay />
                                <span>Start Learning</span>
                            </motion.span>
                        </div>

                        {/* Progress indicator */}
                        {course.progress > 0 && (
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="card-content">
                    <div className="card-header">
                        <h3 className="card-title">{course.title}</h3>
                    </div>

                    <p className="card-subtitle">{course.subtitle}</p>
                    <p className="card-description">{course.description}</p>

                    <div className="card-footer">
                        <div className="meta-group">
                            <div className="meta-item">
                                <FaLayerGroup className="meta-icon" />
                                <span>{course.modules || 12} Modules</span>
                            </div>
                            <div className="meta-item">
                                <FaClock className="meta-icon" />
                                <span>{course.duration || 'Self-Paced'}</span>
                            </div>
                        </div>
                        <div className="arrow-wrapper">
                            <FaArrowRight className="arrow-icon" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
});

CourseCard.displayName = 'CourseCard';

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyState = ({ searchTerm, onReset }) => (
    <motion.div
        className="empty-state"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4 }}
    >
        <div className="empty-illustration">
            <div className="empty-icon">🔍</div>
            <div className="empty-rings">
                <div className="ring ring-1" />
                <div className="ring ring-2" />
                <div className="ring ring-3" />
            </div>
        </div>
        <h3 className="empty-title">No courses found</h3>
        <p className="empty-text">
            We couldn't find any courses matching "<strong>{searchTerm}</strong>"
        </p>
        <motion.button
            className="reset-btn"
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            Clear Search
        </motion.button>
    </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const CourseCatalog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Simulate initial loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    // Memoized filtered courses
    const filteredCourses = useMemo(() => {
        let result = [...registry];

        if (debouncedSearch) {
            const term = debouncedSearch.toLowerCase().trim();
            result = result.filter(course =>
                course.title.toLowerCase().includes(term) ||
                course.subtitle.toLowerCase().includes(term) ||
                course.description?.toLowerCase().includes(term)
            );
        }

        if (activeFilter !== 'all') {
            result = result.filter(course =>
                course.category?.toLowerCase() === activeFilter.toLowerCase()
            );
        }

        return result;
    }, [debouncedSearch, activeFilter]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(
            registry
                .map(c => c.category)
                .filter(Boolean)
        )];
        return ['all', ...cats];
    }, []);

    // Handlers
    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        setDebouncedSearch('');
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleFilterChange = useCallback((filter) => {
        setActiveFilter(filter);
    }, []);

    return (
        <div className="course-catalog">
            <div className="ambient-bg" aria-hidden="true">
                <div className="gradient-orb orb-1" />
                <div className="gradient-orb orb-2" />
                <div className="gradient-orb orb-3" />
                <div className="grid-pattern" />
                <div className="noise-texture" />
            </div>

            {/* Header */}
            <header className="catalog-header">
                <div className="container">
                    <motion.div
                        className="header-content"
                        variants={headerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <span className="header-badge">
                            <FaStar className="badge-icon" />
                            Premium Learning
                        </span>

                        <h1 className="page-title">
                            Discover Your Next
                            <span className="gradient-text"> Learning Journey</span>
                        </h1>

                        <p className="page-subtitle">
                            Master VFX, 3D Design, and creative skills with our curated
                            collection of industry-leading courses
                        </p>
                    </motion.div>

                    {/* Search Section */}
                    <motion.div
                        className="search-section"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="search"
                                className="search-input"
                                placeholder="Search courses, topics, or skills..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                aria-label="Search courses"
                            />
                            <AnimatePresence>
                                {searchTerm && (
                                    <motion.button
                                        className="clear-btn"
                                        onClick={handleClearSearch}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.15 }}
                                        aria-label="Clear search"
                                    >
                                        <FaTimes />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Filter Tabs */}
                        {categories.length > 1 && (
                            <nav className="filter-nav" aria-label="Course categories">
                                <div className="filter-tabs">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            className={`filter-tab ${activeFilter === category ? 'active' : ''}`}
                                            onClick={() => handleFilterChange(category)}
                                            aria-pressed={activeFilter === category}
                                        >
                                            {category === 'all' ? 'All Courses' : category}
                                        </button>
                                    ))}
                                </div>
                            </nav>
                        )}
                    </motion.div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
                    {/* Results Info */}
                    <motion.div
                        className="results-bar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <p className="results-count">
                            <span className="count-number">{filteredCourses.length}</span>
                            {filteredCourses.length === 1 ? ' course' : ' courses'} available
                            {debouncedSearch && (
                                <span className="search-query"> for "{debouncedSearch}"</span>
                            )}
                        </p>
                    </motion.div>

                    {/* Course Grid */}
                    {isLoading ? (
                        <div className="courses-grid" aria-busy="true" aria-label="Loading courses">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <>
                            <motion.div
                                className="courses-grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredCourses.map((course, index) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            index={index}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>

                            {/* Empty State */}
                            <AnimatePresence>
                                {filteredCourses.length === 0 && (
                                    <EmptyState
                                        searchTerm={debouncedSearch}
                                        onReset={handleClearSearch}
                                    />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </main>

            {/* Styles */}
            <style>{`
                /* ===== CSS VARIABLES ===== */
                :root {
                    --bg-primary: #030712;
                    --bg-secondary: #0a0f1a;
                    --bg-card: rgba(255, 255, 255, 0.02);
                    --bg-card-hover: rgba(255, 255, 255, 0.05);
                    --border-color: rgba(255, 255, 255, 0.06);
                    --border-hover: rgba(255, 255, 255, 0.12);
                    --accent-primary: #6366f1;
                    --accent-secondary: #8b5cf6;
                    --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
                    --text-primary: #f8fafc;
                    --text-secondary: #94a3b8;
                    --text-muted: #64748b;
                    --radius-sm: 8px;
                    --radius-md: 12px;
                    --radius-lg: 20px;
                    --radius-xl: 24px;
                    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
                    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
                    --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
                    --transition-fast: 0.15s ease;
                    --transition-base: 0.3s ease;
                    --transition-slow: 0.5s ease;
                }

                /* ===== BASE STYLES ===== */
                .course-catalog {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    position: relative;
                    overflow-x: hidden;
                    -webkit-font-smoothing: antialiased;
                }

                .container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 24px;
                    position: relative;
                    z-index: 1;
                }

                /* ===== AMBIENT BACKGROUND ===== */
                .ambient-bg {
                    position: fixed;
                    inset: 0;
                    overflow: hidden;
                    z-index: 0;
                    pointer-events: none;
                }

                .gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.5;
                    will-change: transform;
                }

                .orb-1 {
                    top: -20%;
                    left: -10%;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, #6366f1 0%, transparent 70%);
                    animation: floatOrb 25s ease-in-out infinite;
                }

                .orb-2 {
                    bottom: -20%;
                    right: -10%;
                    width: 700px;
                    height: 700px;
                    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
                    animation: floatOrb 30s ease-in-out infinite reverse;
                }

                .orb-3 {
                    top: 40%;
                    left: 50%;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
                    animation: floatOrb 20s ease-in-out infinite 5s;
                }

                .grid-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                .noise-texture {
                    position: absolute;
                    inset: 0;
                    opacity: 0.03;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                }

                @keyframes floatOrb {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(30px, -30px) scale(1.05); }
                    50% { transform: translate(-20px, 20px) scale(0.95); }
                    75% { transform: translate(20px, 10px) scale(1.02); }
                }

                /* ===== HEADER ===== */
                .catalog-header {
                    padding: 100px 0 60px;
                    text-align: center;
                }

                .header-content {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .header-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 100px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #a5b4fc;
                    margin-bottom: 24px;
                }

                .badge-icon {
                    font-size: 0.75rem;
                    color: #fbbf24;
                }

                .page-title {
                    font-size: clamp(2.5rem, 5vw, 4rem);
                    font-weight: 800;
                    line-height: 1.1;
                    letter-spacing: -0.03em;
                    margin: 0 0 20px;
                    color: var(--text-primary);
                }

                .gradient-text {
                    background: var(--accent-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .page-subtitle {
                    font-size: 1.15rem;
                    line-height: 1.7;
                    color: var(--text-secondary);
                    max-width: 600px;
                    margin: 0 auto;
                }

                /* ===== SEARCH SECTION ===== */
                .search-section {
                    margin-top: 48px;
                }

                .search-container {
                    position: relative;
                    max-width: 560px;
                    margin: 0 auto;
                }

                .search-icon {
                    position: absolute;
                    left: 22px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    font-size: 1rem;
                    z-index: 2;
                    pointer-events: none;
                }

                .search-input {
                    width: 100%;
                    padding: 18px 50px 18px 54px;
                    border: 1px solid var(--border-color);
                    border-radius: 100px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    color: var(--text-primary);
                    font-size: 1rem;
                    font-family: inherit;
                    transition: all var(--transition-base);
                    outline: none;
                }

                .search-input:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--border-hover);
                }

                .search-input:focus {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
                }

                .search-input::placeholder {
                    color: var(--text-muted);
                }

                .clear-btn {
                    position: absolute;
                    right: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 50%;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .clear-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: var(--text-primary);
                }

                /* ===== FILTER TABS ===== */
                .filter-nav {
                    margin-top: 28px;
                }

                .filter-tabs {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .filter-tab {
                    padding: 10px 20px;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 100px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 500;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    text-transform: capitalize;
                }

                .filter-tab:hover {
                    border-color: var(--border-hover);
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.03);
                }

                .filter-tab.active {
                    background: var(--accent-primary);
                    border-color: var(--accent-primary);
                    color: white;
                }

                /* ===== MAIN CONTENT ===== */
                .main-content {
                    padding: 40px 0 100px;
                }

                .results-bar {
                    margin-bottom: 32px;
                }

                .results-count {
                    font-size: 0.95rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .count-number {
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .search-query {
                    color: var(--accent-primary);
                }

                /* ===== COURSE GRID ===== */
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                    gap: 28px;
                }

                /* ===== COURSE CARD ===== */
                .course-card {
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    text-decoration: none;
                    transition: all var(--transition-base);
                    height: 100%;
                    backdrop-filter: blur(8px);
                }

                .course-card:hover {
                    transform: translateY(-6px);
                    background: var(--bg-card-hover);
                    border-color: var(--border-hover);
                    box-shadow: var(--shadow-lg);
                }

                /* Card Image */
                .card-image-wrapper {
                    padding: 14px 14px 0;
                }

                .card-image {
                    aspect-ratio: 16 / 9;
                    position: relative;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                }

                .gradient-bg {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .gradient-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%);
                }

                .course-icon-wrapper {
                    width: 70px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(8px);
                    border-radius: 50%;
                    z-index: 1;
                }

                .course-icon {
                    font-size: 1.8rem;
                    color: white;
                }

                .card-image img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Badges */
                .badge-container {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: flex;
                    gap: 8px;
                    z-index: 3;
                }

                .badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 6px 12px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-radius: var(--radius-sm);
                }

                .badge-new {
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                }

                /* Hover Overlay */
                .hover-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.65);
                    backdrop-filter: blur(4px);
                    opacity: 0;
                    transition: opacity var(--transition-base);
                    z-index: 2;
                }

                .course-card:hover .hover-overlay {
                    opacity: 1;
                }

                .play-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 28px;
                    background: white;
                    color: #0f172a;
                    border: none;
                    border-radius: 100px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    box-shadow: var(--shadow-md);
                }

                /* Progress Bar */
                .progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.2);
                }

                .progress-fill {
                    height: 100%;
                    background: var(--accent-gradient);
                    border-radius: 0 4px 4px 0;
                }

                /* Card Content */
                .card-content {
                    padding: 20px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .card-header {
                    margin-bottom: 8px;
                }

                .card-title {
                    margin: 0;
                    font-size: 1.35rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.35;
                }

                .card-subtitle {
                    margin: 0 0 14px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: var(--accent-primary);
                }

                .card-description {
                    margin: 0 0 20px;
                    font-size: 0.92rem;
                    line-height: 1.65;
                    color: var(--text-secondary);
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Card Footer */
                .card-footer {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 18px;
                    border-top: 1px solid var(--border-color);
                }

                .meta-group {
                    display: flex;
                    gap: 20px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .meta-icon {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .arrow-wrapper {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 50%;
                    opacity: 0;
                    transform: translateX(-8px);
                    transition: all var(--transition-base);
                }

                .course-card:hover .arrow-wrapper {
                    opacity: 1;
                    transform: translateX(0);
                }

                .arrow-icon {
                    font-size: 0.85rem;
                    color: var(--text-primary);
                }

                /* ===== SKELETON LOADING ===== */
                .skeleton-card {
                    pointer-events: none;
                }

                .skeleton-image {
                    aspect-ratio: 16 / 9;
                    border-radius: var(--radius-lg);
                    background: linear-gradient(
                        90deg,
                        rgba(255,255,255,0.03) 0%,
                        rgba(255,255,255,0.06) 50%,
                        rgba(255,255,255,0.03) 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }

                .skeleton-line {
                    height: 16px;
                    border-radius: 8px;
                    background: linear-gradient(
                        90deg,
                        rgba(255,255,255,0.03) 0%,
                        rgba(255,255,255,0.06) 50%,
                        rgba(255,255,255,0.03) 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    margin-bottom: 12px;
                }

                .skeleton-line.title-line { width: 75%; height: 22px; }
                .skeleton-line.subtitle-line { width: 50%; }
                .skeleton-line.text-line { width: 100%; }
                .skeleton-line.text-line.short { width: 60%; }

                .skeleton-footer {
                    display: flex;
                    gap: 16px;
                    margin-top: auto;
                    padding-top: 18px;
                    border-top: 1px solid var(--border-color);
                }

                .skeleton-meta {
                    width: 80px;
                    height: 14px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.04);
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                /* ===== EMPTY STATE ===== */
                .empty-state {
                    text-align: center;
                    padding: 80px 24px;
                }

                .empty-illustration {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 32px;
                }

                .empty-icon {
                    position: relative;
                    z-index: 2;
                    font-size: 4rem;
                    line-height: 1;
                }

                .empty-rings {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ring {
                    position: absolute;
                    border-radius: 50%;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    animation: pulse-ring 2s ease-out infinite;
                }

                .ring-1 { width: 100%; height: 100%; animation-delay: 0s; }
                .ring-2 { width: 130%; height: 130%; animation-delay: 0.3s; }
                .ring-3 { width: 160%; height: 160%; animation-delay: 0.6s; }

                @keyframes pulse-ring {
                    0% { opacity: 0.6; transform: scale(0.8); }
                    100% { opacity: 0; transform: scale(1.2); }
                }

                .empty-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 12px;
                }

                .empty-text {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    margin: 0 0 28px;
                }

                .reset-btn {
                    padding: 14px 32px;
                    background: var(--accent-primary);
                    border: none;
                    border-radius: 100px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .reset-btn:hover {
                    background: var(--accent-secondary);
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .catalog-header {
                        padding: 80px 0 40px;
                    }

                    .page-title {
                        font-size: 2.2rem;
                    }

                    .page-subtitle {
                        font-size: 1rem;
                    }

                    .courses-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .filter-tabs {
                        justify-content: flex-start;
                        overflow-x: auto;
                        padding-bottom: 8px;
                        -webkit-overflow-scrolling: touch;
                    }

                    .filter-tab {
                        flex-shrink: 0;
                    }
                }

                @media (max-width: 480px) {
                    .container {
                        padding: 0 16px;
                    }

                    .card-content {
                        padding: 16px 18px 20px;
                    }

                    .meta-group {
                        flex-direction: column;
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CourseCatalog;