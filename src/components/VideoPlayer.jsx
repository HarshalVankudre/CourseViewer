import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaVolumeDown,
    FaExpand, FaCompress, FaClosedCaptioning, FaSave,
    FaRedo, FaUndo, FaKeyboard, FaCheck, FaSpinner,
    FaBookmark, FaRegBookmark
} from 'react-icons/fa';
import { MdPictureInPictureAlt, MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import { BiSkipNext, BiSkipPrevious } from 'react-icons/bi';
import { updateProgress, saveNote } from '../utils/api';

const VideoPlayer = ({
    lesson,
    onComplete,
    onToggleComplete,
    isCompleted,
    initialTime = 0,
    initialNote = '',
    onProgressUpdate,
    onNextLesson,
    onPrevLesson,
    onVideoEnd,
    isBookmarked = false,
    onToggleBookmark
}) => {
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const progressBarRef = useRef(null);
    const notesSaveTimeoutRef = useRef(null);
    const progressSaveTimeoutRef = useRef(null);

    // Core state
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Volume state
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('videoPlayerVolume');
        return saved ? parseFloat(saved) : 1;
    });
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    // UI state
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Playback state
    const [playbackSpeed, setPlaybackSpeed] = useState(() => {
        const saved = localStorage.getItem('videoPlayerSpeed');
        return saved ? parseFloat(saved) : 1;
    });
    const [isBuffering, setIsBuffering] = useState(false);
    const [isPiP, setIsPiP] = useState(false);

    // Save states
    const [noteSaveStatus, setNoteSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const [progressSaveStatus, setProgressSaveStatus] = useState('idle');
    const [noteContent, setNoteContent] = useState(initialNote || '');

    // Seek preview
    const [seekPreview, setSeekPreview] = useState({ show: false, time: 0, x: 0 });

    // Skip indicator
    const [showSeekIndicator, setShowSeekIndicator] = useState({ show: false, direction: null, x: 0 });

    // Double click handling
    const [clickTimeout, setClickTimeout] = useState(null);

    // Bookmarks (timestamps)
    const [bookmarks, setBookmarks] = useState([]);

    // Custom subtitle rendering
    const [currentSubtitle, setCurrentSubtitle] = useState('');
    const subtitleCuesRef = useRef([]);

    const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // Format time helper
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds === null) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Reset on lesson change
    useEffect(() => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setBuffered(0);
        setNoteContent(initialNote || '');
        setNoteSaveStatus('idle');

        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
            videoRef.current.load();
        }
    }, [lesson]);

    // Apply initial note when it changes
    useEffect(() => {
        setNoteContent(initialNote || '');
    }, [initialNote]);

    // Handle resume
    const handleResume = () => {
        if (videoRef.current && initialTime > 0) {
            videoRef.current.currentTime = initialTime;
        }
        setShowResumePrompt(false);
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => { });
    };

    const handleStartOver = () => {
        setShowResumePrompt(false);
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => { });
    };

    // Save progress to server
    const saveProgressToServer = useCallback(async (time, completed = isCompleted) => {
        try {
            setProgressSaveStatus('saving');
            await updateProgress(lesson.url, completed, Math.floor(time));
            if (onProgressUpdate) onProgressUpdate(Math.floor(time));
            setProgressSaveStatus('saved');
            setTimeout(() => setProgressSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save progress:', error);
            setProgressSaveStatus('error');
        }
    }, [lesson.url, isCompleted, onProgressUpdate]);

    // Save progress periodically and on pause
    useEffect(() => {
        const interval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused && videoRef.current.currentTime > 0) {
                saveProgressToServer(videoRef.current.currentTime);
            }
        }, 15000); // Every 15 seconds

        return () => clearInterval(interval);
    }, [saveProgressToServer]);

    // Save on pause or before unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (videoRef.current && videoRef.current.currentTime > 0) {
                // Use sendBeacon for reliable saves on page close
                const data = JSON.stringify({
                    lessonUrl: lesson.url,
                    completed: isCompleted,
                    timestamp: Math.floor(videoRef.current.currentTime)
                });
                navigator.sendBeacon('/api/progress', data);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [lesson.url, isCompleted]);

    // Debounced note saving
    const handleNoteChange = (e) => {
        const value = e.target.value;
        setNoteContent(value);
        setNoteSaveStatus('saving');

        // Clear previous timeout
        if (notesSaveTimeoutRef.current) {
            clearTimeout(notesSaveTimeoutRef.current);
        }

        // Debounce save
        notesSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await saveNote(lesson.url, value);
                setNoteSaveStatus('saved');
                setTimeout(() => setNoteSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save note:', error);
                setNoteSaveStatus('error');
            }
        }, 1000); // Save 1 second after user stops typing
    };

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto-hide controls
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSpeedMenu(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [isPlaying, resetControlsTimeout]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            if (!videoRef.current) return;

            const video = videoRef.current;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowright':
                case 'l':
                    e.preventDefault();
                    skip(10);
                    break;
                case 'arrowleft':
                case 'j':
                    e.preventDefault();
                    skip(-10);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    changeVolume(0.1);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    changeVolume(-0.1);
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'c':
                    e.preventDefault();
                    toggleCaptions();
                    break;
                case 'p':
                    e.preventDefault();
                    togglePiP();
                    break;
                case 'b':
                    e.preventDefault();
                    addBookmark();
                    break;
                case 'n':
                    if (e.shiftKey && onNextLesson) {
                        e.preventDefault();
                        onNextLesson();
                    }
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    video.currentTime = (parseInt(e.key) / 10) * video.duration;
                    break;
                case 'home':
                    e.preventDefault();
                    video.currentTime = 0;
                    break;
                case 'end':
                    e.preventDefault();
                    video.currentTime = video.duration;
                    break;
                case '>':
                    e.preventDefault();
                    cycleSpeed(1);
                    break;
                case '<':
                    e.preventDefault();
                    cycleSpeed(-1);
                    break;
                case '?':
                    e.preventDefault();
                    setShowShortcuts(prev => !prev);
                    break;
                case 'escape':
                    setShowSpeedMenu(false);
                    setShowShortcuts(false);

                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNextLesson]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                saveProgressToServer(videoRef.current.currentTime);
            }
        }
    };

    const skip = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(
                videoRef.current.duration,
                videoRef.current.currentTime + seconds
            ));
            showSkipIndicator(seconds > 0 ? 'forward' : 'backward');
        }
    };

    const showSkipIndicator = (direction) => {
        setShowSeekIndicator({
            show: true,
            direction,
            x: direction === 'forward' ? '75%' : '25%'
        });
        setTimeout(() => setShowSeekIndicator({ show: false, direction: null, x: 0 }), 500);
    };

    const changeVolume = (delta) => {
        if (videoRef.current) {
            const newVolume = Math.max(0, Math.min(1, volume + delta));
            setVolume(newVolume);
            videoRef.current.volume = newVolume;
            localStorage.setItem('videoPlayerVolume', newVolume.toString());
            if (newVolume > 0 && isMuted) {
                setIsMuted(false);
                videoRef.current.muted = false;
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            videoRef.current.muted = newMuted;
        }
    };

    const cycleSpeed = (direction) => {
        const currentIndex = playbackSpeeds.indexOf(playbackSpeed);
        const newIndex = Math.max(0, Math.min(playbackSpeeds.length - 1, currentIndex + direction));
        const newSpeed = playbackSpeeds[newIndex];
        handleSpeedChange(newSpeed);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            setCurrentTime(current);
            setProgress((current / dur) * 100);

            // Update buffered
            if (videoRef.current.buffered.length > 0) {
                const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
                setBuffered((bufferedEnd / dur) * 100);
            }

            // Update custom subtitle
            if (captionsEnabled && subtitleCuesRef.current.length > 0) {
                const activeCue = subtitleCuesRef.current.find(
                    cue => current >= cue.start && current <= cue.end
                );
                setCurrentSubtitle(activeCue ? activeCue.text : '');
            } else {
                setCurrentSubtitle('');
            }

            // Mark complete if near end (90%)
            if (current / dur > 0.9 && !isCompleted) {
                onComplete();
                saveProgressToServer(current, true);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            videoRef.current.playbackRate = playbackSpeed;
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;

            // Seamlessly resume from saved position
            if (initialTime > 0) {
                videoRef.current.currentTime = initialTime;
            }

            // Load and parse subtitles for custom rendering
            if (lesson.subtitle) {
                fetch(lesson.subtitle)
                    .then(res => res.text())
                    .then(vttText => {
                        const cues = parseVTT(vttText);
                        subtitleCuesRef.current = cues;
                        // Hide native captions
                        if (videoRef.current?.textTracks?.[0]) {
                            videoRef.current.textTracks[0].mode = 'hidden';
                        }
                    })
                    .catch(err => console.error('Failed to load subtitles:', err));
            }
        }
    };

    // Parse VTT file
    const parseVTT = (vttText) => {
        const cues = [];
        const lines = vttText.split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();
            // Look for timestamp lines (00:00:00.000 --> 00:00:00.000)
            if (line.includes('-->')) {
                const [startStr, endStr] = line.split('-->').map(s => s.trim());
                const start = parseTimestamp(startStr);
                const end = parseTimestamp(endStr);

                // Collect text lines until empty line
                let text = '';
                i++;
                while (i < lines.length && lines[i].trim() !== '') {
                    text += (text ? '\n' : '') + lines[i].trim();
                    i++;
                }

                if (text) {
                    // Strip HTML-like tags from subtitle text
                    text = text.replace(/<[^>]+>/g, '');
                    cues.push({ start, end, text });
                }
            }
            i++;
        }
        return cues;
    };

    // Parse timestamp to seconds
    const parseTimestamp = (ts) => {
        const parts = ts.split(':');
        if (parts.length === 3) {
            const [h, m, s] = parts;
            return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(',', '.'));
        } else if (parts.length === 2) {
            const [m, s] = parts;
            return parseFloat(m) * 60 + parseFloat(s.replace(',', '.'));
        }
        return 0;
    };

    const handleProgressBarClick = (e) => {
        if (!progressBarRef.current || !videoRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pos * videoRef.current.duration;
    };

    const handleProgressBarHover = (e) => {
        if (!progressBarRef.current || !videoRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const previewTime = pos * videoRef.current.duration;
        setSeekPreview({
            show: true,
            time: previewTime,
            x: Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left))
        });
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            playerContainerRef.current.requestFullscreen();
        }
    };

    const togglePiP = async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiP(false);
            } else if (videoRef.current) {
                await videoRef.current.requestPictureInPicture();
                setIsPiP(true);
            }
        } catch (err) {
            console.error('PiP error:', err);
        }
    };

    const toggleCaptions = () => {
        // Only toggle the custom subtitle overlay
        // Keep native text tracks always hidden to prevent double subtitles
        setCaptionsEnabled(prev => !prev);
        // Ensure native captions stay hidden
        if (videoRef.current?.textTracks?.[0]) {
            videoRef.current.textTracks[0].mode = 'hidden';
        }
    };

    const addBookmark = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setBookmarks(prev => [...prev, { time, id: Date.now() }].sort((a, b) => a.time - b.time));
        }
    };

    const removeBookmark = (id) => {
        setBookmarks(prev => prev.filter(b => b.id !== id));
    };

    const seekToBookmark = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const handleVideoClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);

            if (clickX < width / 3) {
                skip(-10);
            } else if (clickX > (width * 2) / 3) {
                skip(10);
            } else {
                toggleFullscreen();
            }
        } else {
            const timeout = setTimeout(() => {
                togglePlay();
                setClickTimeout(null);
            }, 200);
            setClickTimeout(timeout);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            if (newVolume > 0) {
                videoRef.current.muted = false;
                setIsMuted(false);
            }
        }
        localStorage.setItem('videoPlayerVolume', newVolume.toString());
    };

    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
        localStorage.setItem('videoPlayerSpeed', speed.toString());
        setShowSpeedMenu(false);
    };

    const VolumeIcon = () => {
        if (isMuted || volume === 0) return <FaVolumeMute size={18} />;
        if (volume < 0.5) return <FaVolumeDown size={18} />;
        return <FaVolumeUp size={18} />;
    };

    const SaveStatusIcon = ({ status }) => {
        switch (status) {
            case 'saving':
                return <FaSpinner className="spin" size={12} style={{ color: 'orange' }} />;
            case 'saved':
                return <FaCheck size={12} style={{ color: '#4ade80' }} />;
            case 'error':
                return <span style={{ color: '#ef4444', fontSize: '12px' }}>!</span>;
            default:
                return null;
        }
    };

    const controlButtonStyle = {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '4px',
        transition: 'all 0.2s ease'
    };

    return (
        <div
            className="video-player-container"
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '20px',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            {/* Header */}
            <div className="video-header" style={{ marginBottom: '16px', paddingLeft: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <h1 style={{ fontSize: '1.3rem', marginBottom: '8px', fontWeight: '600', flex: 1 }}>{lesson.title}</h1>

                    {/* Progress Save Indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.6)',
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px'
                    }}>
                        <SaveStatusIcon status={progressSaveStatus} />
                        <span>
                            {progressSaveStatus === 'saving' && 'Saving...'}
                            {progressSaveStatus === 'saved' && 'Progress saved'}
                            {progressSaveStatus === 'error' && 'Save failed'}
                            {progressSaveStatus === 'idle' && 'Auto-save on'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Clickable completion status */}
                    <button
                        onClick={onToggleComplete}
                        style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: isCompleted ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                            color: isCompleted ? 'black' : 'white',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark as complete'}
                    >
                        {isCompleted ? '✓ COMPLETED' : '○ MARK COMPLETE'}
                    </button>

                    {/* Bookmark button */}
                    <button
                        onClick={onToggleBookmark}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: isBookmarked ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                            color: isBookmarked ? '#f59e0b' : 'white',
                            border: isBookmarked ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                        {isBookmarked ? <FaBookmark size={10} /> : <FaRegBookmark size={10} />}
                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>

                    {playbackSpeed !== 1 && (
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: 'rgba(255,165,0,0.2)',
                            color: 'orange'
                        }}>
                            {playbackSpeed}x Speed
                        </span>
                    )}


                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="header-btn"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <FaKeyboard size={12} /> Shortcuts
                    </button>
                </div>
            </div>

            {/* Player Container */}
            <div
                ref={playerContainerRef}
                className="player-wrapper"
                onMouseMove={resetControlsTimeout}
                onMouseLeave={() => isPlaying && setShowControls(false)}
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: isFullscreen ? 'unset' : '16/9',
                    height: isFullscreen ? '100%' : 'auto',
                    maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 350px)',
                    minHeight: '300px',
                    background: '#000',
                    borderRadius: isFullscreen ? '0' : '12px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
            >
                <video
                    ref={videoRef}
                    src={lesson.url}
                    preload="auto"
                    crossOrigin="anonymous"
                    playsInline
                    disablePictureInPicture={false}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        cursor: showControls ? 'default' : 'none'
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onClick={handleVideoClick}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onCanPlay={() => setIsBuffering(false)}
                    onCanPlayThrough={() => setIsBuffering(false)}
                    onEnded={() => {
                        setIsPlaying(false);
                        saveProgressToServer(videoRef.current?.duration || 0, true);
                        if (onVideoEnd) onVideoEnd();
                    }}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    controls={false}
                >
                    {lesson.subtitle && (
                        <track
                            kind="subtitles"
                            src={lesson.subtitle}
                            srcLang="en"
                            label="English"
                            default
                        />
                    )}
                </video>

                {/* Custom Subtitle Overlay */}
                {captionsEnabled && currentSubtitle && (
                    <div style={{
                        position: 'absolute',
                        bottom: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        maxWidth: '80%',
                        textAlign: 'center',
                        zIndex: 15,
                        pointerEvents: 'none'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            background: 'rgba(0,0,0,0.75)',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '400',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            lineHeight: '1.4',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {currentSubtitle}
                        </span>
                    </div>
                )}

                {/* Resume Prompt */}
                {showResumePrompt && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 30
                    }}>
                        <div style={{
                            background: 'rgba(30,30,30,0.95)',
                            padding: '30px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            maxWidth: '400px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Resume Watching?</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
                                You left off at <strong style={{ color: 'var(--accent-color)' }}>{formatTime(initialTime)}</strong>
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={handleResume}
                                    style={{
                                        padding: '10px 24px',
                                        background: 'var(--accent-color)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'black',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <FaPlay size={12} /> Resume
                                </button>
                                <button
                                    onClick={handleStartOver}
                                    style={{
                                        padding: '10px 24px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Start Over
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buffering Indicator */}
                {isBuffering && !showResumePrompt && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '3px solid rgba(255,255,255,0.2)',
                            borderTop: '3px solid var(--accent-color)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                )}

                {/* Play/Pause Center Icon */}
                {!isPlaying && !isBuffering && !showResumePrompt && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 15,
                            cursor: 'pointer'
                        }}
                        onClick={togglePlay}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            transition: 'transform 0.2s, background 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                        >
                            <FaPlay size={30} style={{ marginLeft: '5px', color: 'white' }} />
                        </div>
                    </div>
                )}

                {/* Skip Indicator */}
                {showSeekIndicator.show && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: showSeekIndicator.x,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 25,
                        animation: 'fadeInOut 0.5s ease'
                    }}>
                        <div style={{
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: 'white'
                        }}>
                            {showSeekIndicator.direction === 'forward' ? (
                                <><FaRedo size={20} /><span style={{ fontSize: '11px', marginTop: '2px' }}>10s</span></>
                            ) : (
                                <><FaUndo size={20} /><span style={{ fontSize: '11px', marginTop: '2px' }}>10s</span></>
                            )}
                        </div>
                    </div>
                )}

                {/* Controls Overlay */}
                <div
                    className="controls-overlay"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
                        padding: '50px 16px 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        opacity: showControls ? 1 : 0,
                        visibility: showControls ? 'visible' : 'hidden',
                        transition: 'opacity 0.3s ease, visibility 0.3s ease',
                        zIndex: 10
                    }}
                >
                    {/* Progress Bar */}
                    <div
                        ref={progressBarRef}
                        className="progress-container"
                        style={{
                            width: '100%',
                            height: '5px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={handleProgressBarClick}
                        onMouseMove={handleProgressBarHover}
                        onMouseLeave={() => setSeekPreview({ ...seekPreview, show: false })}
                    >
                        {/* Buffered */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${buffered}%`,
                            background: 'rgba(255,255,255,0.3)',
                            borderRadius: '3px',
                            pointerEvents: 'none'
                        }} />

                        {/* Progress */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${progress}%`,
                            background: 'var(--accent-color)',
                            borderRadius: '3px',
                            pointerEvents: 'none'
                        }} />

                        {/* Bookmarks on progress bar */}
                        {bookmarks.map(bookmark => (
                            <div
                                key={bookmark.id}
                                style={{
                                    position: 'absolute',
                                    top: '-3px',
                                    left: `${(bookmark.time / duration) * 100}%`,
                                    width: '3px',
                                    height: '11px',
                                    background: 'yellow',
                                    borderRadius: '1px',
                                    cursor: 'pointer',
                                    zIndex: 5
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    seekToBookmark(bookmark.time);
                                }}
                                title={`Bookmark: ${formatTime(bookmark.time)}`}
                            />
                        ))}

                        {/* Progress Handle */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${progress}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '14px',
                            height: '14px',
                            background: 'var(--accent-color)',
                            borderRadius: '50%',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            pointerEvents: 'none'
                        }} />

                        {/* Seek Preview Tooltip */}
                        {seekPreview.show && (
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: seekPreview.x,
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.95)',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {formatTime(seekPreview.time)}
                            </div>
                        )}
                    </div>

                    {/* Control Buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        {/* Left Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                                onClick={togglePlay}
                                style={controlButtonStyle}
                                title={isPlaying ? 'Pause (K)' : 'Play (K)'}
                            >
                                {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
                            </button>

                            {onPrevLesson && (
                                <button
                                    onClick={onPrevLesson}
                                    style={controlButtonStyle}
                                    title="Previous Lesson"
                                >
                                    <BiSkipPrevious size={24} />
                                </button>
                            )}
                            {onNextLesson && (
                                <button
                                    onClick={onNextLesson}
                                    style={controlButtonStyle}
                                    title="Next Lesson (Shift+N)"
                                >
                                    <BiSkipNext size={24} />
                                </button>
                            )}

                            <button
                                onClick={() => skip(-10)}
                                style={controlButtonStyle}
                                title="Rewind 10s (J)"
                            >
                                <FaUndo size={14} />
                            </button>

                            <button
                                onClick={() => skip(10)}
                                style={controlButtonStyle}
                                title="Forward 10s (L)"
                            >
                                <FaRedo size={14} />
                            </button>

                            {/* Volume */}
                            <div
                                style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
                                onMouseEnter={() => setShowVolumeSlider(true)}
                                onMouseLeave={() => setShowVolumeSlider(false)}
                            >
                                <button
                                    onClick={toggleMute}
                                    style={controlButtonStyle}
                                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                                >
                                    <VolumeIcon />
                                </button>

                                <div style={{
                                    width: showVolumeSlider ? '80px' : '0px',
                                    overflow: 'hidden',
                                    transition: 'width 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        style={{
                                            width: '70px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--accent-color)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Time Display */}
                            <span style={{
                                fontSize: '13px',
                                color: 'rgba(255,255,255,0.9)',
                                marginLeft: '8px',
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap'
                            }}>
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        {/* Right Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* Bookmark */}
                            <button
                                onClick={addBookmark}
                                style={controlButtonStyle}
                                title="Add Bookmark (B)"
                            >
                                <FaRegBookmark size={16} />
                            </button>

                            {/* Captions */}
                            {lesson.subtitle && (
                                <button
                                    onClick={toggleCaptions}
                                    style={{
                                        ...controlButtonStyle,
                                        color: captionsEnabled ? 'var(--accent-color)' : 'white',
                                        opacity: captionsEnabled ? 1 : 0.6
                                    }}
                                    title="Subtitles (C)"
                                >
                                    <FaClosedCaptioning size={18} />
                                </button>
                            )}

                            {/* Speed */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                    style={{
                                        ...controlButtonStyle,
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        minWidth: '45px'
                                    }}
                                    title="Playback Speed"
                                >
                                    {playbackSpeed}x
                                </button>

                                {showSpeedMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        right: 0,
                                        background: 'rgba(20,20,20,0.98)',
                                        borderRadius: '8px',
                                        padding: '8px 0',
                                        marginBottom: '8px',
                                        minWidth: '120px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        zIndex: 100,
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {playbackSpeeds.map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => handleSpeedChange(speed)}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    padding: '8px 16px',
                                                    background: playbackSpeed === speed ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                    border: 'none',
                                                    color: playbackSpeed === speed ? 'var(--accent-color)' : 'white',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {speed === 1 ? 'Normal' : `${speed}x`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Picture in Picture */}
                            {document.pictureInPictureEnabled && (
                                <button
                                    onClick={togglePiP}
                                    style={{
                                        ...controlButtonStyle,
                                        color: isPiP ? 'var(--accent-color)' : 'white'
                                    }}
                                    title="Picture in Picture (P)"
                                >
                                    <MdPictureInPictureAlt size={20} />
                                </button>
                            )}

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                style={controlButtonStyle}
                                title="Fullscreen (F)"
                            >
                                {isFullscreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top Gradient (for title in fullscreen) */}
                {isFullscreen && showControls && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                        padding: '20px',
                        zIndex: 10
                    }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '500' }}>{lesson.title}</h2>
                    </div>
                )}
            </div>

            {/* Bookmarks Section */}
            {bookmarks.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaBookmark size={12} /> Bookmarks ({bookmarks.length})
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {bookmarks.map(bookmark => (
                            <div
                                key={bookmark.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <button
                                    onClick={() => seekToBookmark(bookmark.time)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent-color)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontWeight: '600'
                                    }}
                                >
                                    {formatTime(bookmark.time)}
                                </button>
                                <button
                                    onClick={() => removeBookmark(bookmark.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        padding: '0 2px',
                                        fontSize: '16px',
                                        lineHeight: 1
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resources Section */}
            {lesson.resources && lesson.resources.length > 0 && (
                <div className="resources-section" style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📁 Resources
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {lesson.resources.map((res, i) => (
                            <a
                                key={i}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resource-link"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: 'var(--accent-color)',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{
                                    marginRight: '8px',
                                    textTransform: 'uppercase',
                                    fontSize: '0.65rem',
                                    background: 'var(--accent-color)',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    color: 'black',
                                    fontWeight: '700'
                                }}>
                                    {res.type || 'FILE'}
                                </span>
                                {res.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            padding: '14px',
            borderRadius: '12px',
            resize: 'vertical',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            fontFamily: 'inherit'
                    }}
                />
        </div>

            {/* Keyboard Shortcuts Modal */ }
    {
        showShortcuts && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}
                onClick={() => setShowShortcuts(false)}
            >
                <div
                    className="glass-panel"
                    style={{
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        background: 'rgba(30,30,30,0.95)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaKeyboard /> Keyboard Shortcuts
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 20px', alignItems: 'center' }}>
                        {[
                            ['Space / K', 'Play / Pause'],
                            ['J', 'Rewind 10 seconds'],
                            ['L', 'Forward 10 seconds'],
                            ['← / →', 'Seek back / forward'],
                            ['↑ / ↓', 'Volume up / down'],
                            ['M', 'Toggle mute'],
                            ['F', 'Toggle fullscreen'],
                            ['C', 'Toggle captions'],
                            ['P', 'Picture-in-picture'],
                            ['B', 'Add bookmark'],
                            ['Shift + N', 'Next lesson'],
                            ['< / >', 'Decrease / Increase speed'],
                            ['0-9', 'Seek to 0%-90%'],
                            ['Home / End', 'Beginning / End'],
                            ['?', 'Show shortcuts'],
                            ['Esc', 'Close menus']
                        ].map(([key, desc], i) => (
                            <React.Fragment key={i}>
                                <kbd style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontFamily: 'monospace',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    whiteSpace: 'nowrap'
                                }}>{key}</kbd>
                                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{desc}</span>
                            </React.Fragment>
                        ))}
                    </div>
                    <button
                        className="btn"
                        onClick={() => setShowShortcuts(false)}
                        style={{
                            marginTop: '24px',
                            width: '100%',
                            padding: '12px',
                            background: 'var(--accent-color)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'black',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Got it
                    </button>
                </div>
            </div>
        )
    }


    {/* Global Styles */ }
    <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .spin {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
                }
                
                .player-wrapper:hover .controls-overlay {
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                
                .progress-container:hover {
                    height: 10px !important;
                }
                
                video::cue {
                    background: rgba(0,0,0,0.7) !important;
                    color: white !important;
                    font-size: 16px !important;
                    font-weight: 400 !important;
                    line-height: 1.3 !important;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
                }
                
                input[type="range"] {
                    -webkit-appearance: none;
                    height: 4px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                }
                
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    background: var(--accent-color);
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                .header-btn:hover {
                    background: rgba(255,255,255,0.15) !important;
                }
                
                .resource-link:hover {
                    background: rgba(255,255,255,0.1) !important;
                    transform: translateY(-2px);
                }
                
                button:hover {
                    background: rgba(255,255,255,0.1) !important;
                }
                
                button:active {
                    transform: scale(0.95);
                }

                textarea:focus {
                    outline: none;
                    border-color: var(--accent-color) !important;
                }

                /* Scrollbar styling */
                .video-player-container::-webkit-scrollbar {
                    width: 8px;
                }
                
                .video-player-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .video-player-container::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                }
                
                .video-player-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.3);
                }
            `}</style>
    {/* Resources Section */ }
    {
        lesson.resources && lesson.resources.length > 0 && (
            <div className="video-resources" style={{ marginTop: '20px', padding: '0 50px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Resources</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {lesson.resources.map((res, index) => (
                        <a
                            key={index}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '6px',
                                color: '#fff',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        >
                            <span style={{ marginRight: '8px' }}>📦</span>
                            {res.title}
                        </a>
                    ))}
                </div>
            </div>
        )
    }
        </div >
    );
};

export default VideoPlayer;
