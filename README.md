# JSON to TOON Converter

A modern web application that converts JSON data into TOON (Token-Oriented Object Notation) format. TOON is a human-readable, tabular format optimized for LLM prompts and data representation.

## About TOON

TOON (Token-Oriented Object Notation) is a format designed to be more efficient for LLM processing than traditional JSON or YAML. It features:

- **Tabular representation** for arrays of objects with uniform structure
- **Compact syntax** that reduces token usage in LLM prompts
- **Human-readable** format that's easy to understand
- **YAML-style indentation** for nested structures

Learn more about the TOON specification: [https://github.com/toon-format/toon](https://github.com/toon-format/toon)

## Features

- ✨ **Real-time JSON validation** with error messages
- 🔄 **Instant conversion** from JSON to TOON format
- 📋 **Copy to clipboard** functionality
- 💾 **Download as file** (.toon extension)
- 🌙 **Dark mode** with system preference detection
- 📊 **Visitor tracking** to show usage statistics
- 🎨 **Modern UI** built with Tailwind CSS
- 📱 **Responsive design** for all screen sizes
- 🧪 **Sample data** button for quick testing

## Tech Stack

- **Angular 21** - Modern Angular with standalone components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **RxJS** - Reactive programming
- **Signals** - Angular's new reactive state management
- **Vitest** - Unit testing framework

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v10.9.2 or higher)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/manthanank/json-to-toon-converter.git
cd json-to-toon-converter
```

1. Install dependencies:

```bash
npm install
```

1. Start the development server:

```bash
npm start
```

1. Open your browser and navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Usage

1. **Enter JSON**: Paste or type your JSON data into the input area
1. **Validate**: The app automatically validates your JSON as you type
1. **Convert**: Click the "Convert →" button to transform JSON to TOON
1. **Copy or Download**: Use the "Copy" button to copy to clipboard or "Download" to save as a `.toon` file

### Example

**Input JSON:**

```json
{
  "users": [
    { "id": 1, "name": "Alice", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ],
  "tags": ["development", "production"]
}
```

**Output TOON:**

```toon
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
tags[2]: development,production
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

### Project Structure

```tree
src/
├── app/
│   ├── app.ts          # Main component with conversion logic
│   ├── app.html        # Template
│   ├── app.css         # Component styles
│   ├── app.routes.ts   # Routing configuration
│   ├── models/         # TypeScript models
│   │   └── visit.model.ts
│   └── services/       # Services
│       └── track.ts    # Visitor tracking service
├── environments/       # Environment configuration
└── styles.css          # Global styles
```

## Features in Detail

### JSON Validation

- Real-time validation as you type
- Clear error messages for invalid JSON
- Visual feedback with red highlighting

### TOON Conversion

- Handles all JSON types: objects, arrays, primitives
- Detects uniform object arrays and converts to tabular format
- Preserves nested structures with proper indentation
- Smart string quoting (only when necessary)

### Dark Mode

- Toggle between light and dark themes
- Remembers your preference in localStorage
- Respects system color scheme preference

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and not licensed for public use.
