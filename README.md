# MathJaxToLaTeX Converter

A Chrome extension that converts MathML (as used by MathJax) to LaTeX code. This utility helps when you need to extract mathematical expressions from web pages or other sources that use MathML for rendering.

## Features

- Converts MathJax/MathML markup to LaTeX notation
- Single-click copying of LaTeX code directly from web pages
- Works as a browser extension for seamless integration with your workflow
- Handles various mathematical expressions including:
  - Basic operations (+, -, ×, ÷)
  - Greek letters
  - Mathematical functions (sin, cos, etc.)
  - Fractions, roots, and other advanced notation
  - Special symbols and operators

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The MathJaxToLaTeX extension is now installed and ready to use

## How to Use

### As a Chrome Extension
1. Navigate to any web page containing MathJax/MathML equations
2. Click on any equation to instantly convert it to LaTeX
3. The LaTeX code is automatically copied to your clipboard
4. Paste the LaTeX code wherever you need it (documents, calculators, etc.)

### Standalone Mode
1. Open `index.html` in your web browser
2. Copy MathML content (typically found in the DOM of pages using MathJax)
3. Paste the MathML into the input area
4. Click "Convert to LaTeX"
5. Get your LaTeX code from the output area

## Example

The tool comes with a preloaded example. When you open the page, you'll see a complex MathML expression that will be converted to:

```latex
f(x) = \cos x - \sin x
```

## Project Structure

- `index.html` - The main interface for the converter
- `translate.js` - Core functions for converting MathML to LaTeX
- `fileunicode.js` - Unicode to LaTeX mappings for various mathematical symbols
- `content.js` - Chrome extension functionality for in-page conversion and single-click copying

## Requirements

No external libraries required! This tool runs entirely in your browser with vanilla JavaScript.

## Development

If you want to extend the tool:

- Add more Unicode-to-LaTeX mappings in `fileunicode.js`
- Modify conversion logic in `translate.js`
- Enhance the UI in `popup.html`
- Extend browser integration in `content.js`

## License

Feel free to use, modify, and distribute this tool according to your needs. Credit to the original author is appreciated.

## Limitations

- Some complex or specialized mathematical notations might require manual adjustment after conversion
- The tool expects properly formatted MathML input
