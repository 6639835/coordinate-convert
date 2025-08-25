# 🚀 Getting Started

## Quick Start

1. **Install Node.js**: Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Version**:
   ```bash
   npm run dev
   ```
   This will start both the React development server and Electron

4. **Build for Production**:
   ```bash
   npm run dist
   ```

## 📋 Before You Start

### Add Application Icon
Replace the placeholder icon with your custom icon:
- Add `icon.png` (512x512 or larger) to the `build/` folder
- The build process will automatically generate platform-specific icons

### 🎯 First Build Test

To test if everything works:

```bash
# Install dependencies
npm install

# Test development build
npm run dev

# Test production build
npm run build

# Create distributable (optional)
npm run pack
```

## 🌐 Deployment via GitHub Actions

1. **Push to GitHub**: Ensure your code is in a GitHub repository

2. **Create Release**: 
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Automatic Build**: GitHub Actions will automatically:
   - Build for Windows and macOS
   - Create `.exe` and `.dmg` files
   - Attach them to the GitHub release

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development with hot reload |
| `npm run build` | Build for production |
| `npm run dist` | Create platform distributables |
| `npm run dist:win` | Build Windows executable |
| `npm run dist:mac` | Build macOS DMG |
| `npm run pack` | Package without creating installer |

## 🎨 Customization

### App Identity
Edit in `package.json`:
- `name`: Application package name
- `productName`: Display name
- `description`: App description
- `version`: App version

### Build Configuration
Edit the `build` section in `package.json` for:
- App ID and certificates
- Target platforms
- Installer options
- File associations

## 📦 Distribution Files

After running `npm run dist`, you'll find:

**Windows:**
- `release/Coordinate Converter Setup 1.0.0.exe` - Installer
- `release/win-unpacked/` - Unpacked application

**macOS:**
- `release/Coordinate Converter-1.0.0.dmg` - DMG installer
- `release/Coordinate Converter-1.0.0-mac.zip` - ZIP archive

## 🐛 Common Issues

### Windows Code Signing
If you see warnings about unsigned code:
- For development: Ignore the warnings
- For distribution: Get a code signing certificate

### macOS Gatekeeper
If macOS blocks the app:
- For development: Right-click → Open → Open anyway
- For distribution: Get an Apple Developer certificate

### Build Errors
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that all required dependencies are installed

## 🎯 Next Steps

1. **Customize the UI**: Edit `src/renderer/src/App.tsx` and `src/renderer/src/App.css`
2. **Add Features**: Extend the DMS converter with new functionality
3. **Configure Auto-Updates**: Set up electron-updater for automatic updates
4. **Add Analytics**: Integrate usage analytics if needed
5. **Create Installer Assets**: Design custom installer backgrounds and icons
