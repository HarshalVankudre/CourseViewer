import React, { useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import Layout from './Layout';
import registry from '../data/course_registry.json';
import defaultCourseConfig from '../config/course.config';

const CourseViewer = () => {
    const { courseId } = useParams();

    // Find the course in registry
    const course = useMemo(() => {
        return registry.find(c => c.id === courseId);
    }, [courseId]);

    // Construct configuration for the selected course
    const courseConfig = useMemo(() => {
        if (!course) return null;

        return {
            ...defaultCourseConfig,
            // Override with registry data
            courseId: course.id,
            courseName: course.title,
            courseSubtitle: course.subtitle,
            contentBaseUrl: course.contentBaseUrl,
            courseDataPath: (course.courseDataPath.startsWith('http') || course.courseDataPath.startsWith('/'))
                ? course.courseDataPath
                : `${course.contentBaseUrl}/${course.courseDataPath}`,
            // Preserve other default settings (theme, features etc)
            // or extend registry to allow overriding these per course
        };
    }, [course]);

    if (!course) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a0a',
                color: 'white',
                gap: '20px'
            }}>
                <h1>Course Not Found</h1>
                <p>The course you are looking for does not exist.</p>
                <Link to="/" style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px'
                }}>
                    Back to Catalog
                </Link>
            </div>
        );
    }

    return (
        <Layout key={courseId} courseConfig={courseConfig} />
    );
};

export default CourseViewer;
