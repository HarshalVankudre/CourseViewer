import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CourseCatalog from './components/CourseCatalog';
import CourseViewer from './components/CourseViewer';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<CourseCatalog />} />
          <Route path="/course/:courseId" element={<CourseViewer />} />
          {/* Fallback to catalog */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
