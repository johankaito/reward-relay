# Logo Assets Guide

## Current Status
This folder contains a placeholder logo. Replace it with your final Canva-designed logo.

## Design in Canva (Free):
1. Go to canva.com (free account)
2. Search for "Logo" templates
3. Design specs:
   - **Colors**: Coral #FF6B6B (primary), Gold #FFD93D (accent)
   - **Concept**: Credit card + reward star + circular arrow
   - **Style**: Modern, geometric, bold
   - **Size**: 1024x1024px square

## Required Exports from Canva:
1. Export as PNG (1024x1024px) → Save as `logo-1024.png`
2. Download/use online converter to create these sizes:
   - 16x16 (favicon.ico)
   - 32x32
   - 180x180 (apple-touch-icon.png)
   - 192x192 (icon-192.png)
   - 512x512 (icon-512.png)
   - 1200x630 (og-image.png for social)

## Online Tools for Resizing (Free):
- favicon.io/favicon-converter
- realfavicongenerator.net
- squoosh.app (Google's image optimizer)

## File Placement:
```
public/
├── logo.svg (main logo)
├── favicon.ico
├── apple-touch-icon.png
├── icon-192.png
├── icon-512.png
├── icon-512-maskable.png (add 20% padding for safe zone)
└── og-image.png
```

app/
├── icon.png → symlink or copy from public/icon-512.png
└── apple-icon.png → symlink or copy from public/apple-touch-icon.png
