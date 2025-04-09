/**
 * Boundary detector for mathematical expressions
 * 
 * This module helps to determine where an expression starts and ends,
 * which is critical for handling nested structures like square roots,
 * fractions, and absolute values.
 */

// Delimiter pairs used in mathematical expressions
const delimiterPairs = {
    'open paren': 'close paren',
    'open bracket': 'close bracket',
    'open brace': 'close brace'
};

// Keywords that indicate expression boundaries
const boundaryKeywords = [
    'plus', 'minus', 'times', 'equals', 'over', 
    'comma', 'is greater than', 'is less than',
    'is greater than or equal to', 'is less than or equal to',
    'd x', 'd y', 'd z', 'degrees'
];

/**
 * Find the end of an expression starting at a given index
 * @param {string[]} tokens - Array of tokens
 * @param {number} startIndex - Starting index in the tokens array
 * @returns {number} - The index where the expression ends
 */
function findExpressionEnd(tokens, startIndex) {
    let depth = 0;
    let i = startIndex;
    
    while (i < tokens.length) {
        const token = tokens[i];
        
        // Check for opening delimiters
        if (Object.keys(delimiterPairs).includes(token)) {
            depth++;
        }
        
        // Check for closing delimiters
        if (Object.values(delimiterPairs).includes(token)) {
            depth--;
            
            // If we're back to the starting depth and this closing delimiter matches
            // an opening delimiter from our expression, include it and stop
            if (depth < 0) {
                return i;
            }
        }
        
        // Check for boundary keywords only at the root level
        if (depth === 0 && boundaryKeywords.includes(token)) {
            return i - 1;
        }
        
        i++;
    }
    
    // If we reach the end, the expression extends to the end
    return tokens.length - 1;
}

/**
 * Extract a complete nested expression from tokens
 * @param {string[]} tokens - Array of tokens
 * @param {number} startIndex - Starting index in the tokens array
 * @returns {object} - The extracted expression and the new position
 */
function extractNestedExpression(tokens, startIndex) {
    const endIndex = findExpressionEnd(tokens, startIndex);
    const expressionTokens = tokens.slice(startIndex, endIndex + 1);
    return {
        expression: expressionTokens.join(' '),
        newPosition: endIndex + 1
    };
}

// Export the functions for browser use
window.BoundaryDetector = {
    findExpressionEnd,
    extractNestedExpression
};
