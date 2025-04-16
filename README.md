# MathJaxToLaTeX Converter

A Chrome extension that converts MathJax/MathML expressions to LaTeX code. This utility helps when you need to extract mathematical expressions from web pages for use in LaTeX documents or other systems that require LaTeX formatting.

## Features

- Automatically detects MathJax/MathML elements on web pages
- Single-click copying of LaTeX code with visual feedback
- Handles various mathematical expressions including:
  - Basic operations (+, -, ×, ÷)
  - Greek letters
  - Mathematical functions (sin, cos, etc.)
  - Fractions, roots, and other notation
  - Special symbols and operators
- Special support for kampus.sanomapro.fi with menu panel blocking and text selection handling

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The MathJaxToLaTeX extension is now installed and ready to use

## How to Use

1. Navigate to any web page containing MathJax/MathML equations
2. Click on any equation rendered by MathJax
3. The LaTeX code will be automatically copied to your clipboard
4. A "Copied!" notification will briefly appear to confirm successful copying
5. Paste the LaTeX code wherever you need it (LaTeX documents, calculators, etc.)


## Project Structure

- `translate.js` - Core functions for converting MathML to LaTeX
- `content.js` - Chrome extension functionality for in-page conversion and click handling
- `popup.js` - Simple popup script for the extension
- Additional files may include Unicode to LaTeX mappings for various mathematical symbols

## Development

If you want to extend the tool:
- Modify conversion logic in `translate.js`
- Enhance browser integration in `content.js`
- Add support for additional math notation types

## Limitations

- Only works on pages that use MathJax for rendering math expressions
- Some complex mathematical notations may not convert perfectly
- Works best with MathJax v3+ generated content
- Special functionality for kampus.sanomapro.fi may interfere with other site features
