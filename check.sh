#!/usr/bin/env bash

# Check if a URL is provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <URL>"
    exit 1
fi

# Extract the filepath
filepath=$(echo "$1" | sed 's/https:\/\/\(.*\)/\1/')

# Step 1: Call npm run check with the provided URL
npm run check "$1"

# Step 2: Call npm run validate with the extracted filepath and "_"
# cd $filepath || { echo "unable to cd into $filepath" > &2; exit 1 }
# find . -type f -exec mv '{}' '{}'.html \;

npm run validate "$filepath"
