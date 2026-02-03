# SkyVector to MSFS 2024 Converter

A Single Page Application (SPA) that converts flight plans from SkyVector.com format to Microsoft Flight Simulator 2024 .PLN format.

🌐 **Live Demo**: [View on GitHub Pages](https://p7th0n.github.io/skyvector_to_msfs2024/)

## Features

- ✈️ **Easy Conversion**: Convert SkyVector GPS coordinates to MSFS 2024 native format
- 📁 **File Support**: Drag-and-drop file upload or paste route strings directly
- 🏷️ **Smart Filenames**: Auto-generated descriptive filenames (e.g., `P34_N68_sv2msfs2024.pln`)
- ✏️ **Filename Customization**: Edit filenames with real-time validation and sanitization
- ✅ **Smart Validation**: Comprehensive error checking with helpful feedback
- 💾 **Download Ready**: Generate and download .PLN files with custom names
- 📋 **Copy to Clipboard**: Quick copy functionality for converted routes
- 🎨 **Modern UI**: Clean, responsive interface optimized for flight planning
- 📱 **Mobile Friendly**: Works seamlessly on desktop and mobile devices

## Supported Formats

### Input (SkyVector Format)

- **Airport Codes**: `P34`, `KLAX`, `N68`
- **GPS Coordinates**:
  - Combined: `403210N0772310W`
  - Separate: `403210N 0772310W`
  - Mixed routes: `P34 403210N0772310W 402507N0773505W N68`

### Output (MSFS 2024 .PLN Format)

- **100% Compatible**: Native MSFS 2024 format based on exported flight plans
- **Proper Coordinates**: Native degrees/minutes/seconds format (e.g., `N40° 32' 9.9996"`)
- **Smart Waypoints**: Coordinate-based IDs matching MSFS exports
- **Complete Metadata**: Full flight plan with departure/arrival info
- **Intelligent Filenames**: Auto-generated based on route (e.g., `P34_N68_sv2msfs2024.pln`)

## Example

**Input:**

```bash
P34 403210N0772310W 402507N0773505W 401034N0774923W N68
```

**Output:** `P34_N68_sv2msfs2024.pln`

```xml
<?xml version="1.0" encoding="UTF-8"?>

<SimBase.Document>
    <FlightPlan.FlightPlan>
        <DepartureID>P34</DepartureID>
        <DestinationID>N68</DestinationID>
        <Title>P34 - N68</Title>
        <Descr>Flight from P34 to N68</Descr>
        <FPType>VFR</FPType>
        <CruisingAlt>3500.000</CruisingAlt>
        <AppVersion>
            <AppVersionMajor>12</AppVersionMajor>
            <AppVersionMinor>2</AppVersionMinor>
            <AppVersionBuild>282174</AppVersionBuild>
        </AppVersion>
        <ATCWaypoint id="4032N07723W">
            <ATCWaypointType>User</ATCWaypointType>
            <WorldPosition>N40° 32' 9.9996",W77° 23' 9.9996",+000000.00</WorldPosition>
            <ICAO>
                <ICAORegion>LL</ICAORegion>
                <ICAOIdent>4032N077</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
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

```bash
src/
├── converter.ts        # Core conversion logic & MSFS 2024 format generation
├── validation.ts       # Input validation and error handling
├── filename-utils.ts   # Filename generation and validation utilities
├── types.ts           # TypeScript type definitions
├── main.ts            # Main application logic and UI management
├── style.css          # Application styles and responsive design
└── tests/             # Comprehensive unit tests (46 tests)
    ├── converter.test.ts
    ├── validation.test.ts
    └── filename-utils.test.ts
```

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. The deployment happens automatically when you push to the main branch.

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your preferred hosting service

## Technology Stack

- **TypeScript** - Type-safe JavaScript with enhanced developer experience
- **Vite** - Fast build tool and development server
- **Vitest** - Unit testing framework (46 comprehensive tests)
- **ESLint** - Code linting and formatting
- **GitHub Actions** - Automated CI/CD pipeline

## Key Features Deep Dive

### 🎯 **Smart Filename Generation**
- Auto-generates descriptive filenames based on departure/arrival airports
- Format: `{origin}_{destination}_sv2msfs2024.pln`
- Examples: `P34_N68_sv2msfs2024.pln`, `KLAX_KORD_sv2msfs2024.pln`
- Intelligent fallback: `UNKNOWN_UNKNOWN_sv2msfs2024.pln`

### ✏️ **Filename Customization**
- Real-time validation and sanitization
- Cross-platform filename compatibility
- Handles invalid characters, reserved names, and length limits
- One-click reset to auto-generated filename

### 🛩️ **MSFS 2024 Native Format**
- Based on actual MSFS 2024 exported flight plans
- Native coordinate format: `N40° 32' 9.9996",W77° 23' 9.9996",+000000.00`
- Coordinate-based waypoint IDs: `4032N07723W`
- AppVersion: `12.2.282174` (current MSFS 2024)

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
