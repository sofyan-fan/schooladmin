#!/bin/bash

# Script to create students using the API from student_registry_data.json
# Usage: ./create_students.sh

API_BASE="http://localhost:3000"
JSON_FILE="students_fixed.json"

echo "🚀 Starting student creation process..."
echo "📁 Reading from: $JSON_FILE"
echo "🌐 API Base URL: $API_BASE"
echo ""

# Check if JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Error: $JSON_FILE not found!"
    exit 1
fi

# Counter for tracking progress
counter=1
total=$(jq length "$JSON_FILE")

echo "📊 Total students to create: $total"
echo "⏳ Starting creation process..."
echo ""

# Read each student from the JSON array and create via API
jq -c '.[]' "$JSON_FILE" | while read student; do
    echo "Creating student $counter/$total..."
    
    # Extract student name for logging
    first_name=$(echo "$student" | jq -r '.first_name')
    last_name=$(echo "$student" | jq -r '.last_name')
    
    # Make API call
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$student" \
        "$API_BASE/general/student")
    
    # Extract HTTP status and body
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    # Check if successful
    if [ "$http_code" -eq 201 ]; then
        student_id=$(echo "$body" | jq -r '.id // "unknown"')
        echo "✅ Created: $first_name $last_name (ID: $student_id)"
    else
        echo "❌ Failed: $first_name $last_name (HTTP: $http_code)"
        echo "   Response: $body"
    fi
    
    # Small delay to avoid overwhelming the server
    sleep 0.1
    
    counter=$((counter + 1))
done

echo ""
echo "🎉 Student creation process completed!"
echo "📈 Check your database to verify all students were created successfully."
echo ""

# Show final count
echo "📊 Verifying creation..."
total_students=$(curl -s "$API_BASE/general/students" | jq 'length')
echo "📋 Total students in database: $total_students"
