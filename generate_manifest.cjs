const fs = require('fs');
const path = require('path');

const COURSE_ROOT = path.join(__dirname, '..'); // Parent directory
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'course_data.json');
const GCS_BASE_URL = 'https://storage.googleapis.com/houdini-fx-assets-omega-479214/assets/videos';

// Helper to sort folders/files naturally (1, 2, 10 instead of 1, 10, 2)
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

async function generateManifest() {
    const chapters = [];

    // Read parent directory
    const items = fs.readdirSync(COURSE_ROOT);

    // Filter folders that look like chapters (start with number)
    const chapterFolders = items.filter(item => {
        const fullPath = path.join(COURSE_ROOT, item);
        return fs.statSync(fullPath).isDirectory() && /^\d+/.test(item);
    }).sort(naturalSort);

    for (const folder of chapterFolders) {
        const folderPath = path.join(COURSE_ROOT, folder);
        const files = fs.readdirSync(folderPath);

        // Filter assets
        const videos = files.filter(f => /\.(mp4|mkv|mov|webm)$/i.test(f));
        const htmls = files.filter(f => /\.(html|txt)$/i.test(f));

        // Combine and sort naturally
        const allLessons = [...videos, ...htmls].sort(naturalSort);

        const subtitles = files.filter(f => /\.(vtt|srt)$/i.test(f));
        const resources = files.filter(f => /\.(pdf|zip|rar|7z)$/i.test(f));

        if (allLessons.length > 0) {
            const lessons = allLessons.map(lessonFile => {
                const isVideo = /\.(mp4|mkv|mov|webm)$/i.test(lessonFile);
                const fileExt = lessonFile.split('.').pop();
                const baseName = lessonFile.replace(new RegExp(`\\.${fileExt}$`, 'i'), '');

                // Find matching subtitle (simple matching by filename start)
                const subtitle = isVideo ? subtitles.find(s => s.startsWith(baseName)) : null;

                // Find related resources
                const lessonResources = resources.filter(r => r.includes(baseName)).map(r => ({
                    title: r,
                    url: `${GCS_BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(r)}`,
                    type: r.split('.').pop()
                }));

                let content = null;
                // If it's a text file, we might want to read its content inline (optional, or just link to it)
                // For now, let's assume we want to load it via URL too, or read it here if it's small.
                // LIMITATION: Loading from GCS via fetch in frontend is easier than reading here if running local.
                // But for a static build, reading here is better.
                // Let's read it here if it's small to avoid CORS/Fetch complexity for text.
                if (!isVideo) {
                    try {
                        content = fs.readFileSync(path.join(folderPath, lessonFile), 'utf-8');
                    } catch (e) {
                        console.warn(`Could not read content for ${lessonFile}`);
                    }
                }

                return {
                    title: baseName,
                    url: isVideo ? `${GCS_BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(lessonFile)}` : null,
                    filename: lessonFile,
                    type: isVideo ? 'video' : 'text',
                    content: content,
                    subtitle: subtitle ? `${GCS_BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(subtitle)}` : null,
                    resources: lessonResources
                };
            });

            // Attach remaining resources that didn't match a specific lesson to the first lesson (or handle separately in UI)
            const assignedResources = new Set(lessons.flatMap(l => l.resources.map(r => r.title)));
            const chapterResources = resources.filter(r => !assignedResources.has(r)).map(r => ({
                title: r,
                url: `${GCS_BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(r)}`,
                type: r.split('.').pop()
            }));

            // Attach general chapter resources to the chapter object directly, or append to first lesson for simplicity in this iteration
            if (chapterResources.length > 0 && lessons.length > 0) {
                lessons[0].resources.push(...chapterResources);
            }

            chapters.push({
                title: folder,
                lessons: lessons
            });
        }
    }

    // Create dir if not exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chapters, null, 2));
    console.log(`Generated manifest with ${chapters.length} chapters.`);
}

generateManifest();
