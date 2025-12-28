const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'loudini_course',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to database at:', res.rows[0].now);
    }
});

// Routes
app.get('/', (req, res) => {
    res.send('Loudini Course Backend Running');
});

// Sync user data (Notes & Progress)
// GET /api/sync/:userId
app.get('/api/sync/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const progressRes = await pool.query('SELECT * FROM progress WHERE user_id = $1', [userId]);
        const notesRes = await pool.query('SELECT * FROM notes WHERE user_id = $1', [userId]);

        // Transform to frontend format
        const progressMap = {};
        progressRes.rows.forEach(row => {
            progressMap[row.lesson_id] = {
                isCompleted: row.is_completed,
                position: row.last_position_seconds,
                updatedAt: row.updated_at
            };
        });

        const completed = {};
        Object.keys(progressMap).forEach(key => {
            if (progressMap[key].isCompleted) completed[key] = true;
        });

        const notes = {};
        notesRes.rows.forEach(row => {
            notes[row.lesson_id] = row.content;
        });

        res.json({ completed, notes, progressMap });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Progress
// POST /api/progress
app.post('/api/progress', async (req, res) => {
    const { userId, lessonId, isCompleted, position } = req.body;
    try {
        // Upsert progress
        await pool.query(`
            INSERT INTO progress (user_id, lesson_id, is_completed, last_position_seconds, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, lesson_id) 
            DO UPDATE SET 
                is_completed = EXCLUDED.is_completed,
                last_position_seconds = EXCLUDED.last_position_seconds,
                updated_at = NOW();
        `, [userId, lessonId, isCompleted, position || 0]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save Note
// POST /api/note
app.post('/api/note', async (req, res) => {
    const { userId, lessonId, content } = req.body;
    try {
        await pool.query(`
            INSERT INTO notes (user_id, lesson_id, content, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, lesson_id) 
            DO UPDATE SET 
                content = EXCLUDED.content,
                updated_at = NOW();
        `, [userId, lessonId, content]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
