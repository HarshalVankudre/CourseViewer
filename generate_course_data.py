#!/usr/bin/env python3
"""
Course Data Generator Script

Scans a Udemy course folder structure and generates course_data.json
for use with the course website platform.

Usage:
    python generate_course_data.py "C:\path\to\course" "https://storage.googleapis.com/your-bucket"
    
Example:
    python generate_course_data.py "C:\Courses\Python Masterclass" "https://storage.googleapis.com/python-course-bucket"
"""

import os
import sys
import json
import re
from pathlib import Path
from urllib.parse import quote

def natural_sort_key(s):
    """Sort strings with numbers in natural order (1, 2, 10 not 1, 10, 2)"""
    return [int(text) if text.isdigit() else text.lower() 
            for text in re.split(r'(\d+)', str(s))]

def get_file_type(filename):
    """Determine lesson type based on file extension"""
    ext = filename.lower().split('.')[-1]
    if ext in ['mp4', 'webm', 'mkv', 'avi', 'mov']:
        return 'video'
    elif ext in ['html', 'htm', 'txt', 'md']:
        return 'text'
    elif ext in ['vtt', 'srt']:
        return 'subtitle'
    elif ext in ['zip', 'rar', '7z', 'pdf', 'doc', 'docx']:
        return 'resource'
    return None

def read_html_content(filepath):
    """Read HTML/text file content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"  Warning: Could not read {filepath}: {e}")
        return None

def generate_url(bucket_url, chapter_name, filename):
    """Generate GCP bucket URL for a file"""
    # URL encode the path components
    encoded_chapter = quote(chapter_name, safe='')
    encoded_file = quote(filename, safe='')
    # Simple structure: bucket/chapter/file
    return f"{bucket_url}/{encoded_chapter}/{encoded_file}"

def find_subtitle(files, video_name):
    """Find matching subtitle file for a video"""
    video_base = os.path.splitext(video_name)[0]
    
    # Try common subtitle naming patterns
    patterns = [
        f"{video_base} English.vtt",
        f"{video_base}.vtt",
        f"{video_base} English.srt",
        f"{video_base}.srt",
    ]
    
    for pattern in patterns:
        if pattern in files:
            return pattern
    return None

def scan_course_folder(course_path, bucket_url):
    """Scan course folder and generate course data structure"""
    course_data = []
    course_path = Path(course_path)
    
    if not course_path.exists():
        print(f"Error: Course path does not exist: {course_path}")
        sys.exit(1)
    
    # Find all chapter folders (sorted naturally)
    chapters = sorted(
        [d for d in course_path.iterdir() if d.is_dir() and not d.name.startswith('.')],
        key=lambda x: natural_sort_key(x.name)
    )
    
    if not chapters:
        # Maybe the course files are directly in the folder
        chapters = [course_path]
    
    print(f"\nScanning course: {course_path.name}")
    print(f"Bucket URL: {bucket_url}")
    print(f"Found {len(chapters)} chapters\n")
    
    for chapter_dir in chapters:
        chapter_name = chapter_dir.name
        print(f"📁 {chapter_name}")
        
        chapter = {
            "title": chapter_name,
            "lessons": []
        }
        
        # Get all files in chapter
        files = {f.name: f for f in chapter_dir.iterdir() if f.is_file()}
        
        # Process files (sorted naturally)
        processed = set()
        sorted_files = sorted(files.keys(), key=natural_sort_key)
        
        for filename in sorted_files:
            if filename in processed:
                continue
                
            file_type = get_file_type(filename)
            
            if file_type == 'video':
                # Video lesson
                subtitle_file = find_subtitle(files, filename)
                subtitle_url = None
                if subtitle_file:
                    subtitle_url = generate_url(bucket_url, chapter_name, subtitle_file)
                    processed.add(subtitle_file)
                
                lesson = {
                    "title": os.path.splitext(filename)[0],
                    "url": generate_url(bucket_url, chapter_name, filename),
                    "filename": filename,
                    "type": "video",
                    "content": None,
                    "subtitle": subtitle_url,
                    "resources": []
                }
                chapter["lessons"].append(lesson)
                processed.add(filename)
                print(f"  🎬 {lesson['title']}")
                
            elif file_type == 'text' and filename not in processed:
                # Text lesson
                content = read_html_content(files[filename])
                lesson = {
                    "title": os.path.splitext(filename)[0],
                    "url": None,
                    "filename": filename,
                    "type": "text",
                    "content": content,
                    "subtitle": None,
                    "resources": []
                }
                chapter["lessons"].append(lesson)
                processed.add(filename)
                print(f"  📄 {lesson['title']}")
                
            elif file_type == 'resource' and filename not in processed:
                # Resource file - attach to previous lesson or create standalone
                resource = {
                    "title": filename,
                    "url": generate_url(bucket_url, chapter_name, filename),
                    "type": filename.split('.')[-1].lower()
                }
                
                if chapter["lessons"]:
                    # Attach to last lesson
                    chapter["lessons"][-1]["resources"].append(resource)
                else:
                    # Create a resources-only text lesson
                    lesson = {
                        "title": "Resources",
                        "url": None,
                        "filename": None,
                        "type": "text",
                        "content": "<p>Download the resources below:</p>",
                        "subtitle": None,
                        "resources": [resource]
                    }
                    chapter["lessons"].append(lesson)
                    
                processed.add(filename)
                print(f"  📦 {filename}")
        
        if chapter["lessons"]:
            course_data.append(chapter)
    
    return course_data

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        print("\nError: Missing arguments!")
        print("Usage: python generate_course_data.py <course_folder> <bucket_url>")
        sys.exit(1)
    
    course_path = sys.argv[1]
    bucket_url = sys.argv[2].rstrip('/')
    
    # Generate course data
    course_data = scan_course_folder(course_path, bucket_url)
    
    # Calculate stats
    total_lessons = sum(len(ch["lessons"]) for ch in course_data)
    video_count = sum(1 for ch in course_data for l in ch["lessons"] if l["type"] == "video")
    text_count = sum(1 for ch in course_data for l in ch["lessons"] if l["type"] == "text")
    
    print(f"\n✅ Scan complete!")
    print(f"   Chapters: {len(course_data)}")
    print(f"   Total lessons: {total_lessons}")
    print(f"   Videos: {video_count}")
    print(f"   Text lessons: {text_count}")
    
    # Output path
    output_path = Path(course_path) / "course_data.json"
    
    # Save JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Saved to: {output_path}")
    print(f"\n💡 Next steps:")
    print(f"   1. Copy this file to: src/data/course_data.json")
    print(f"   2. Update src/config/course.config.js with course details")
    print(f"   3. Run: npm run build")

if __name__ == "__main__":
    main()
