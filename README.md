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

## Testing

### Setup

1. Install Node.js if you haven't already
2. Install dependencies by running:
   ```
   npm install
   ```

### Running the Tests

#### Default Test (Playwright - Recommended)
```
npm test
```
This runs the test in **quiet mode** (no browser console output).

#### Verbose Mode (Shows Browser Console)
```
npm run test:verbose
```
This shows all browser console output and debug information.

#### Test Output Modes

- **Quiet Mode (default)**: Shows only test results and pass/fail status
- **Verbose Mode**: Shows browser console output, debug information, and detailed test steps

You can enable verbose mode in two ways:
1. Use `npm run test:verbose`
2. Set environment variable: `VERBOSE=true npm test`

### What the Test Does

The test will:

1. **Launch Chrome** with your extension loaded
2. **Test 1**: Navigate to your local test equation file and click on the MathJax element
3. **Test 2**: Navigate to mathjax.org and click on the hero-math equation
4. **Show clipboard contents** after each click to verify the LaTeX was copied

### Expected Results

- For your local test equation: Should copy the LaTeX representation
- For MathJax.org hero equation: Should copy exactly:
  ```
  f \left( a \right) = \frac{1 }{2 {\pi} i }\oint _{{\gamma} }\frac{f \left( z \right) }{z - a }d z
  ```
  Note the spaces around operators and within the `\left(` and `\right)` commands.

### Troubleshooting

If the test doesn't work:

1. Make sure all extension files are in the same directory as the test
2. Check that `tests/MathJaxTestEquation.html` exists
3. Try running Chrome with `--no-sandbox` flag if you get sandbox errors
4. Make sure you have the latest version of Chrome installed

### Test Output Control

The Playwright test includes a toggle for console output:
- Use `npm test` for clean, minimal output (recommended for CI/CD)
- Use `npm run test:verbose` when debugging to see all browser console logs

## Limitations

- Only works on pages that use MathJax for rendering math expressions
- Some complex mathematical notations may not convert perfectly
- Works best with MathJax v3+ generated content
- Special functionality for kampus.sanomapro.fi may interfere with other site features
