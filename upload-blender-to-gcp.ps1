# Upload Blender Course to GCP Storage
# This script creates a bucket and uploads all course files

$PROJECT_ID = "omega-signifier-479214-g6"
$BUCKET_NAME = "blender-fasttrack-course"
$COURSE_FOLDER = "C:\Users\canno\OneDrive\Desktop\Udemy - Complete Houdini FX 19 Bootcamp 2022-3\CGFasttrack - Blender Fast Track Vol 2 Sword in the Stone"

Write-Host "Creating GCP bucket: $BUCKET_NAME" -ForegroundColor Cyan

# Create the bucket (regional for lower costs)
gcloud storage buckets create gs://$BUCKET_NAME --project=$PROJECT_ID --location=us-central1 --uniform-bucket-level-access

# Set CORS policy for browser access
$corsJson = @"
[
  {
    "origin": ["http://localhost:5173", "http://localhost:3000", "https://course-website-2wtvedoqxa-uc.a.run.app", "https://course-website-942547788950.us-central1.run.app"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
"@

$corsJson | Out-File -FilePath ".\cors-blender.json" -Encoding utf8
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=cors-blender.json

Write-Host "Uploading course files..." -ForegroundColor Cyan

# Upload the entire course folder
gcloud storage cp -r "$COURSE_FOLDER\*" gs://$BUCKET_NAME/

# Make the bucket publicly readable
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member=allUsers --role=roles/storage.objectViewer

Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host "Bucket URL: https://storage.googleapis.com/$BUCKET_NAME" -ForegroundColor Yellow
