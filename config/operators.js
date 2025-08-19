/**
 * Operator mappings for LaTeX conversion
 */
const OPERATOR_MAPPINGS = {
  // Basic operators with spacing
  '=': ' = ',
  '+': ' + ',
  '-': ' - ',
  '−': ' - ', // Unicode minus
  '×': ' \\times ',
  '÷': ' \\div ',
  '±': ' \\pm ',
  '*': ' * ',
  
  // Comparison operators
  '<': ' < ',
  '>': ' > ',
  '≤': ' \\leq ',
  '\\leq': ' \\leq ',
  '≥': ' \\geq ',
  '\\geq': ' \\geq ',
  '≠': ' \\neq ',
  '\\neq': ' \\neq ',
  '≈': ' \\approx ',
  '\\approx': ' \\approx ',
  
  // Arrows
  '→': ' \\rightarrow ',
  '\\rightarrow': ' \\rightarrow ',
  
  // Brackets and delimiters (no spacing)
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '{': '\\{',
  '}': '\\}',
  '|': '|', // Will be handled specially for absolute values
  
  // Special characters
  '\'': '\'',
  '′': '\'', // Unicode prime
  '': '', // Empty/invisible operators
  
  // Combining characters (should be empty as they're handled by mover)
  '\u20D7': '', // Vector arrow
  '\u0305': '', // Overline
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OPERATOR_MAPPINGS };
} else {
  window.OPERATOR_MAPPINGS = OPERATOR_MAPPINGS;
}