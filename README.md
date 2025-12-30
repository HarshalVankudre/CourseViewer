# 🎬 Multi-Course Learning Platform

A modern, cloud-native video course platform built with React and Google Cloud. Host multiple video courses with a beautiful glassmorphism UI, progress tracking, and seamless streaming.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![GCP](https://img.shields.io/badge/Google_Cloud-Run-4285F4?logo=googlecloud)

---

## ✨ Features

- **📚 Multi-Course Catalog**: Browse all your courses in a responsive, searchable grid.
- **🎨 Premium UI**: Glassmorphism design, smooth animations, and skeleton loading states.
- **🎥 Adaptive Player**: Custom video player with keyboard shortcuts and playback speed control.
- **💾 Auto-Save**: Progress is automatically saved to local storage so you can resume exactly where you left off.
- **🔍 Search & Filter**: Instantly find specific courses or filter by category.
- **☁️ Cloud Native**: Optimized for Google Cloud Storage streaming and Cloud Run hosting.
- **📱 Responsive**: Fully optimized for desktop, tablet, and mobile viewing.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+ (for generating course data)
- Google Cloud Platform account

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/course-platform.git
cd course-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
course-platform/
├── src/
│   ├── components/
│   │   ├── CourseCatalog.jsx   # 🏠 Main course grid & search
│   │   ├── CourseViewer.jsx    # 📺 Course player container
│   │   ├── Layout.jsx          #     Main layout wrapper
│   │   ├── VideoPlayer.jsx     #     Custom video player
│   │   └── Sidebar.jsx         #     Lesson navigation
│   ├── data/
│   │   └── course_registry.json # ⚙️ Central course configuration
│   └── utils/
│       └── api.js              #     API utilities
├── public/
│   └── assets/                 #     Static assets (thumbnails)
├── generate_course_data.py     # 🛠️ Python script to scan course folders
├── Dockerfile                  # 🐳 Container configuration
└── README.md
```

---

## ⚙️ Configuration

Courses are managed in `src/data/course_registry.json`. To add or modify courses, update this file:

```json
[
    {
        "id": "my-course-id",
        "title": "Course Title",
        "description": "Short description...",
        "thumbnail": "/assets/images/my-thumb.jpg",
        "contentBaseUrl": "https://storage.googleapis.com/my-bucket",
        "courseDataPath": "course_data.json"
    }
]
```

---

## 📦 Adding a New Course

1.  **Prepare Content**: Organize your video files and running the generation script:
    ```bash
    python generate_course_data.py "C:\Path\To\Course" "https://storage.googleapis.com/your-bucket"
    ```
2.  **Upload to Cloud**: Upload the course folder and the generated `course_data.json` to a GCS bucket.
    ```bash
    gcloud storage cp -r "C:\Path\To\Course\*" gs://your-bucket/
    ```
3.  **Register Course**: Add the course details to `src/data/course_registry.json`.
4.  **Add Thumbnail**: Place a standard 16:9 thumbnail in `public/assets/images/`.

---

## ☁️ Deployment

The project is configured for **Google Cloud Run**.

```bash
# Deploy directly from source
gcloud run deploy course-website --source . --region us-central1 --allow-unauthenticated
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `←` / `→` | Seek -10s / +10s |
| `↑` / `↓` | Volume Up / Down |
| `F` | Toggle Fullscreen |
| `M` | Mute/Unmute |
| `Shift + N` | Next Lesson |
| `[` / `]` | Speed Control |

---

<p align="center">
  Made with ❤️ for the learning community
</p>
