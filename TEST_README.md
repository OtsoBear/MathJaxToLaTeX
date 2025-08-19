# Testing the MathJax to LaTeX Extension

## Setup

1. Install Node.js if you haven't already
2. Install dependencies by running:
   ```
   npm install
   ```

## Running the Tests

### Default Test (Playwright - Recommended)
```
npm test
```
This runs the test in **quiet mode** (no browser console output).

### Verbose Mode (Shows Browser Console)
```
npm run test:verbose
```
This shows all browser console output and debug information.

### Test Output Modes

- **Quiet Mode (default)**: Shows only test results and pass/fail status
- **Verbose Mode**: Shows browser console output, debug information, and detailed test steps

You can enable verbose mode in two ways:
1. Use `npm run test:verbose`
2. Set environment variable: `VERBOSE=true npm test`

## What the Test Does

The test will:

1. **Launch Chrome** with your extension loaded
2. **Test 1**: Navigate to your local test equation file and click on the MathJax element
3. **Test 2**: Navigate to mathjax.org and click on the hero-math equation
4. **Show clipboard contents** after each click to verify the LaTeX was copied

## Expected Results

- For your local test equation: Should copy the LaTeX representation
- For MathJax.org hero equation: Should copy exactly:
  ```
  f \left( a \right) = \frac{1 }{2 {\pi} i }\oint _{{\gamma} }\frac{f \left( z \right) }{z - a }d z
  ```
  Note the spaces around operators and within the `\left(` and `\right)` commands.

## Notes

- The browser will stay open after the test completes so you can inspect it
- Press Ctrl+C in the terminal to close the browser and exit
- If you see "Could not read clipboard", you may need to manually grant clipboard permissions
- The test runs with `headless: false` so you can watch what's happening

## Troubleshooting

If the test doesn't work:

1. Make sure all extension files are in the same directory as the test
2. Check that `tests/MathJaxTestEquation.html` exists
3. Try running Chrome with `--no-sandbox` flag if you get sandbox errors
4. Make sure you have the latest version of Chrome installed

## Test Output Control

The Playwright test includes a toggle for console output:
- Use `npm test` for clean, minimal output (recommended for CI/CD)
- Use `npm run test:verbose` when debugging to see all browser console logs