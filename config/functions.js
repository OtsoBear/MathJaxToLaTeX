/**
 * Standard mathematical function names
 */
const STANDARD_FUNCTIONS = [
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc',
  'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
  'log', 'ln', 'exp', 'lim', 'max', 'min',
  'sup', 'inf'
];

/**
 * Check if the name is a standard mathematical function
 * @param {string} name - The name to check
 * @return {boolean} - True if standard function, false otherwise
 */
function isStandardFunction(name) {
  if (!name) return false;
  return STANDARD_FUNCTIONS.includes(name.toLowerCase());
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STANDARD_FUNCTIONS, isStandardFunction };
} else {
  window.STANDARD_FUNCTIONS = STANDARD_FUNCTIONS;
  window.isStandardFunction = isStandardFunction;
}