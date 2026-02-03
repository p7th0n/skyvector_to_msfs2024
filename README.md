# SkyVector to MSFS 2024 Converter

A Single Page Application (SPA) that converts flight plans from SkyVector.com format to Microsoft Flight Simulator 2024 .PLN format.

🌐 **Live Demo**: [View on GitHub Pages](https://yourusername.github.io/skyvector_to_msfs2024/)

## Features

- ✈️ **Easy Conversion**: Convert SkyVector GPS coordinates to MSFS 2024 decimal format
- 📁 **File Support**: Upload text files or paste route strings directly
- ✅ **Smart Validation**: Comprehensive error checking with helpful feedback
- 💾 **Download Ready**: Generate and download .PLN files instantly
- 📋 **Copy to Clipboard**: Quick copy functionality for converted routes
- 🎨 **Modern UI**: Clean, responsive interface optimized for flight planning

## Supported Formats

### Input (SkyVector Format)
- **Airport Codes**: `P34`, `KLAX`, `N68`
- **GPS Coordinates**: 
  - Combined: `403210N0772310W`
  - Separate: `403210N 0772310W`
  - Mixed routes: `P34 403210N0772310W 402507N0773505W N68`

### Output (MSFS 2024 .PLN Format)
- Valid XML format compatible with Microsoft Flight Simulator 2024
- Proper waypoint structure with Airport and User waypoint types
- Correct coordinate conversion to decimal degrees

## Example

**Input:**
```
P34 403210N0772310W 402507N0773505W 401034N0774923W N68
```

**Output:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document Type="AceXML" version="2,0">
  <Descr>FlightPlan</Descr>
  <FlightPlan.FlightPlan>
    <Title>P34 to N68</Title>
    <FPType>VFR</FPType>
    ...
  </FlightPlan.FlightPlan>
</SimBase.Document>
```

## Development

### Prerequisites
- Node.js 18 or higher
- npm

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Project Structure
```
src/
├── converter.ts     # Core conversion logic
├── validation.ts    # Input validation and error handling
├── types.ts         # TypeScript type definitions
├── main.ts          # Main application logic
├── style.css        # Application styles
└── tests/           # Unit tests
```

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. The deployment happens automatically when you push to the main branch.

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your preferred hosting service

## Technology Stack

- **TypeScript** - Type-safe JavaScript with enhanced developer experience
- **Vite** - Fast build tool and development server
- **Vitest** - Unit testing framework
- **ESLint** - Code linting and formatting
- **GitHub Actions** - Automated CI/CD pipeline

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Create a Pull Request

## License

MIT License - see LICENSE file for details.

