# 🌍 Coordinate Converter

A beautiful, modern desktop application for converting DMS (Degrees, Minutes, Seconds) coordinates to decimal degrees. Built with Electron, React, and TypeScript for cross-platform compatibility.

## ✨ Features

- **Modern UI**: Beautiful, responsive interface with gradient backgrounds and smooth animations
- **Multiple DMS Formats**: Supports various DMS input formats
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Real-time Conversion**: Instant conversion as you type
- **Keyboard Shortcuts**: Efficient workflow with keyboard shortcuts
- **Copy to Clipboard**: One-click copying of results
- **Dark Mode Support**: Automatic dark/light mode detection

## 🚀 Supported Formats

The application supports various DMS coordinate formats:

- `N45°30'15" W122°40'30"`
- `N4530.25 W12240.5`
- `45°30'15"N 122°40'30"W`
- `N45 30 15 W122 40 30`

## 🛠️ Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd coordinate-convert
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Building

Build for development:
```bash
npm run build
```

Build distributables:
```bash
# For current platform
npm run dist

# For specific platforms
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:all    # All platforms
```

## 📦 Distribution

The application uses GitHub Actions to automatically build distributables for Windows and macOS on every release.

### Manual Release

1. Update version in `package.json`
2. Create and push a git tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
3. GitHub Actions will automatically build and create a release

## ⌨️ Keyboard Shortcuts

- **Enter**: Convert coordinates
- **Escape**: Clear fields
- **Ctrl+C**: Copy result to clipboard

## 🏗️ Architecture

- **Frontend**: React with TypeScript
- **Styling**: Custom CSS with CSS variables for theming
- **Desktop**: Electron for cross-platform desktop application
- **Build**: Vite for fast development and building
- **Packaging**: electron-builder for creating distributables

## 📁 Project Structure

```
coordinate-convert/
├── src/
│   ├── main/               # Electron main process
│   │   └── main.ts
│   └── renderer/           # React frontend
│       ├── src/
│       │   ├── App.tsx
│       │   ├── App.css
│       │   ├── main.tsx
│       │   └── index.css
│       ├── utils/
│       │   └── dmsConverter.ts
│       └── index.html
├── build/                  # Build resources (icons, etc.)
├── dist/                   # Built application
├── release/                # Distribution packages
└── .github/workflows/      # GitHub Actions
```

## 🎨 Design System

The application uses a custom design system with:

- **Color Palette**: Primary gradient from purple to blue
- **Typography**: System fonts with multiple weight variants
- **Spacing**: Consistent spacing scale using CSS variables
- **Components**: Reusable card, button, and input components
- **Responsive**: Mobile-first responsive design
- **Accessibility**: Focus states, high contrast support, reduced motion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Original Python implementation inspiration
- Electron and React communities
- Beautiful gradient designs
