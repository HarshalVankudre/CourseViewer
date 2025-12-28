# 🎬 Course Platform

A modern, feature-rich video course platform built with React. Host any video course with progress tracking, bookmarks, seamless video playback, and more.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎥 **Video Player** | Custom controls, keyboard shortcuts, playback speed |
| 📊 **Progress Tracking** | Auto-save position, resume exactly where you left off |
| ✅ **Completion Marking** | Manual or auto-complete when video ends |
| 🔖 **Bookmarks** | Save favorite lessons for quick access |
| 📝 **Subtitles** | Custom styled subtitle overlay |
| ⏭️ **Auto-Next** | Automatically plays next lesson |
| 💾 **Persistence** | Progress saved to localStorage + optional backend |
| 🎨 **Dark Theme** | Beautiful modern dark UI |
| 📱 **Responsive** | Works on desktop and mobile |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+ (for course generation)
- GCP account (for hosting content)

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
│   │   ├── Layout.jsx          # Main layout with sidebar
│   │   ├── VideoPlayer.jsx     # Custom video player
│   │   ├── Sidebar.jsx         # Course navigation
│   │   └── TextLesson.jsx      # HTML/text lessons
│   ├── config/
│   │   └── course.config.js    # ⚙️ Course configuration
│   └── utils/
│       └── api.js              # Backend API utilities
├── server/                      # Optional backend API
├── generate_course_data.py      # 🛠️ Course JSON generator
└── README.md
```

---

## ⚙️ Configuration

Edit `src/config/course.config.js`:

```javascript
const courseConfig = {
    courseId: 'my-course',                    // Unique ID (no spaces)
    courseName: 'My Awesome Course',          // Display name
    courseSubtitle: 'Complete Guide',         // Subtitle
    contentBaseUrl: 'https://storage.googleapis.com/my-bucket',
    accentColor: '#3b82f6',
    faviconEmoji: '🎓',
};
```

---

## 📦 Adding a New Course

### 1. Create GCP Bucket
```bash
gcloud storage buckets create gs://my-course-bucket --location=us
```

### 2. Upload Course Content
```bash
# Upload entire course folder
gcloud storage cp -r "./My Course/*" gs://my-course-bucket/
```

Expected structure:
```
my-course-bucket/
├── 1 - Introduction/
│   ├── 1 - Welcome.mp4
│   └── 1 - Welcome English.vtt
├── 2 - Basics/
│   └── ...
└── course_data.json
```

### 3. Generate Course Data
```bash
python generate_course_data.py "C:\path\to\course" "https://storage.googleapis.com/my-course-bucket"
```

### 4. Upload JSON Manifest
```bash
gcloud storage cp course_data.json gs://my-course-bucket/
```

### 5. Update Configuration
Edit `course.config.js` with your new bucket URL and course details.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Seek -10s / +10s |
| `↑` / `↓` | Volume up/down |
| `F` | Toggle fullscreen |
| `M` | Mute/Unmute |
| `C` | Toggle captions |
| `N` | Next lesson |
| `P` | Previous lesson |
| `[` / `]` | Decrease/Increase speed |

---

## 🛠️ Development

```bash
# Start frontend
npm run dev

# Start backend (optional, for progress sync)
cd server
npm install
node index.js
```

---

## 📄 License

MIT License - feel free to use for your own courses!

---

<p align="center">
  Made with ❤️ for learners everywhere
</p>
