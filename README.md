# MathJax to LaTeX Translator

A comprehensive utility to translate MathJax aria-label text into LaTeX code.

## Features

- Translates MathJax aria-label descriptions into equivalent LaTeX expressions
- Handles complex mathematical structures such as:
  - Fractions
  - Roots (square root, nth root)
  - Integrals
  - Absolute values
  - Parentheses and brackets
  - Function notation
  - Mathematical symbols and operations
  - Special characters and notations

## Usage

1. Open `index.html` in a web browser
2. Enter MathJax aria-label text in the input box
3. Click "Translate" to get the equivalent LaTeX code
4. Use provided examples to test the functionality

## Test Suite

The project includes a comprehensive test suite to validate the translator against numerous examples:

1. Open `tests.html` in a web browser to run all tests
2. The test page will show which conversions pass or fail
3. Use the test cases as examples for your own translations

## Examples

Here are some example translations:

| MathJax aria-label | LaTeX Output |
|-------------------|-------------|
| A equals 2 pi the integral from 0 to 1 of the absolute value of f of x times the square root of 1 plus f prime x squared d x | `A=2\pi \int _0^1\left\|f\left(x\right)\right\|\sqrt{1+f'\left(x\right)^2}dx` |
| V equals one third pi r squared h | `V=\frac{1}{3}\pi r^2h` |
| the integral from 0 to pi of open paren 1 plus the sine of x over 2 close paren d x | `\int _0^{\pi }\left(1+\sin \frac{x}{2}\right)dx` |
| f of x equals cosine x minus sine x | `f\left(x\right)=\cos x-\sin x` |
| a x en dash 1 is greater than 2 a en dash x | `ax-1>2a-x` |
| open bracket 0 comma 3 close bracket | `\left[0{,}\ 3\right]` |

## Advanced Usage

You can also use the translator programmatically by accessing the `translateAriaToLatex` function:

