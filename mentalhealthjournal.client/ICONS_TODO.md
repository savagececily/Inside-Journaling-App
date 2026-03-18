# PWA Icons Setup Guide

## Icon Generation Complete ✅

All required PWA icons have been generated from your logo files and are committed to the repository.

### Generated Files in `public/`:
- ✅ `logo-light.png` - Source logo (500x500)
- ✅ `logo-dark.png` - Dark mode logo (500x500)
- ✅ `pwa-64x64.png` - Small icon
- ✅ `pwa-192x192.png` - Standard PWA icon
- ✅ `pwa-512x512.png` - Large icon
- ✅ `maskable-icon-512x512.png` - Android adaptive icon
- ✅ `apple-touch-icon-180x180.png` - iOS home screen
- ✅ `favicon.ico` - Browser tab icon

---

## Regenerating Icons (If Needed)

If you update your logo files, regenerate the PWA icons:

```bash
cd mentalhealthjournal.client
npx @vite-pwa/assets-generator --preset minimal public/logo-light.png
```

This will recreate all icon sizes automatically.

---

## Required Icon Sizes (Generated Automatically)

After running the generator, these files are created in `public/`:
- ✅ `pwa-64x64.png` - Small icon
- ✅ `pwa-192x192.png` - Standard PWA icon
- ✅ `pwa-512x512.png` - Large icon
- ✅ `maskable-icon-512x512.png` - Android adaptive icon
- ✅ `apple-touch-icon-180x180.png` - iOS home screen
- ✅ `favicon.ico` - Browser tab icon

All icons are automatically generated from your source logo file.

---

## Creating Your Source Logo

Your source logo file should be:
- **Size**: 500x500px or larger (square)
- **Format**: PNG with transparency
- **Design**: Simple, recognizable icon representing mental health/journaling
- **Colors**: Use app theme colors (#6366f1 indigo)
- **Safe zone**: Keep important elements in center 80% for maskable icons

### Design Ideas:
- Journal book icon
- Brain with heart symbol
- Peaceful/wellness icon
- Growth plant (🌱 like the app uses)

---

## Placeholder Icons for Development

If you don't have a logo yet, create a simple placeholder:

```bash
# Create a simple colored square as placeholder
convert -size 512x512 xc:#6366f1 -pointsize 200 -fill white -gravity center -annotate +0+0 "IJ" public/logo-light.png
```

Or use any temporary image file and regenerate later with your real logo.

---

## For Production Deployment

### Option 1: CI/CD Pipeline
Add a build step that copies icon files from a secure location:
```yaml
# Example GitHub Actions step
- name: Copy production icons
  run: |
    cp ${{ secrets.ICON_PATH }}/*.png public/
```

### Option 2: CDN Hosting
Host icons separately and update manifest.json paths:
```json
{
  "icons": [
    {
      "src": "https://cdn.yourapp.com/icons/pwa-192x192.png",
      "sizes": "192x192"
    }
  ]
}
```

### Option 3: Direct Server Upload
Upload icon files directly to your production server's `public/` directory after deployment.

---

## Verifying PWA Icons

After generating icons, test them:

1. **Local Testing:**
   ```bash
   npm run build
   npm run preview
   # Open http://localhost:4173 in browser
   ```

2. **Check in DevTools:**
   - Open Chrome DevTools → Application → Manifest
   - Verify all icon URLs load correctly
   - Check for manifest warnings

3. **Mobile Testing:**
   - Deploy to test environment
   - Test "Add to Home Screen" on iOS and Android
   - Verify icon appears correctly on home screen

---

## Quick Reference

**Generate icons:**
```bash
npx @vite-pwa/assets-generator --preset minimal public/logo-light.png
```

**Files excluded from git:**
- `logo-*.png`
- `pwa-*.png`
- `maskable-icon-*.png`
- `apple-touch-icon-*.png`
- `favicon.ico`

**Remember:** Icons must exist in production deployment even though they're not in the repository.
