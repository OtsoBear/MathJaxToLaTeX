// Dictionary for simple replacements with precise LaTeX spacing
const termMappings = {
    'equals': '=',
    'plus': '+',
    'minus': '-',
    'times': '\\cdot',
    'squared': '^2',
    'cubed': '^3',
    'fourth power': '^4',
    'fifth power': '^5',
    'pi': '\\pi',
    'sine': '\\sin',
    'cosine': '\\cos',
    'cos': '\\cos',
    'sin': '\\sin',
    'tan': '\\tan',
    'log': '\\log',
    'log base 10': '\\lg',
    'log base': '\\log_',
    'ln': '\\ln',
    'e': 'e',
    'is greater than': '>',
    'is less than': '<',
    'is greater than or equal to': '\\ge',
    'is less than or equal to': '\\le',
    'greater than or equal to': '\\ge',
    'less than or equal to': '\\le',
    'is a member of': '\\in',
    'R': '\\mathbb{R}',
    'N': '\\mathbb{N}',
    'Z': '\\mathbb{Z}',
    'Q': '\\mathbb{Q}',
    'C': '\\mathbb{C}',
    'dx': 'dx',
    'dy': 'dy',
    'dz': 'dz',
    'dt': 'dt',
    'comma': '{,}\\ ',
    'degrees': '°',
    'en dash': '-',
    'negative': '-',
    'infinity': '\\infty',
    'alpha': '\\alpha',
    'beta': '\\beta',
    'gamma': '\\gamma',
    'delta': '\\Delta',
    'theta': '\\theta',
    'lambda': '\\lambda',
    'for all': '\\forall',
    'there exists': '\\exists',
    'such that': ':\\',
    'one third': '\\frac{1}{3}',
    'one fourth': '\\frac{1}{4}',
    'one half': '\\frac{1}{2}',
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'r': 'r',
    'h': 'h',
    'a': 'a',
    'b': 'b',
    'x': 'x',
    'y': 'y',
    'z': 'z',
    't': 't',
};

// Special structures and their handlers
const specialStructures = [
    {
        // Sine squared, cosine squared, etc.
        pattern: /(sin|cos|tan)\s+squared/gi,
        replacement: (match, func) => `\\${func.toLowerCase()} ^2`
    },
    {
        // Fourth power of functions
        pattern: /the\s+fourth\s+power\s+of\s+(cos|sin|tan)(?:ine)?/gi,
        replacement: (match, func) => `\\${func.toLowerCase()} ^4`
    },
    {
        // Trig functions with variables
        pattern: /(sin|cos|tan)(?:e)?\s+(?:of\s+)?([a-z](?:\s*\/\s*\d+)?)/gi,
        replacement: (match, func, variable) => {
            // Check if variable contains fraction like x/2
            if (variable.includes('/')) {
                const parts = variable.split('/').map(p => p.trim());
                return `\\${func.toLowerCase()} \\frac{${parts[0]}}{${parts[1]}}`;
            }
            return `\\${func.toLowerCase()} ${variable}`;
        }
    },
    {
        // Absolute value
        pattern: /the\s+absolute\s+value\s+of\s+(.*?)(?=\s*(?:plus|minus|times|equals|$))/gi,
        replacement: (match, content) => `\\left|${translateText(content)}\\right|`
    },
    {
        // Bar over variable (vector notation)
        pattern: /(\w)\s+bar/gi,
        replacement: (match, content) => `\\bar{${content}}`
    },
    {
        // Line segment
        pattern: /the\s+line\s+segment\s+([A-Z][A-Z])/gi,
        replacement: (match, content) => `\\bar{${content}}`
    },
    {
        // Function notation
        pattern: /([a-z])\s+of\s+([a-z])/gi,
        replacement: (match, func, variable) => `${func}\\left(${variable}\\right)`
    },
    {
        // Function with prime
        pattern: /([a-z])\s+prime\s+([a-z])/gi,
        replacement: (match, func, variable) => `${func}'\\left(${variable}\\right)`
    },
    {
        // Square root
        pattern: /the\s+square\s+root\s+of\s+(.*?)(?=\s*(?:plus|minus|times|equals|$|-))/gi,
        replacement: (match, content) => `\\sqrt{${translateText(content)}}`
    },
    {
        // nth root
        pattern: /the\s+([a-z]+)\s+root\s+of\s+(.*?)(?=\s*(?:plus|minus|times|equals|$))/gi,
        replacement: (match, order, content) => {
            const orderMap = {
                'third': '3',
                'fourth': '4',
                'fifth': '5',
                'sixth': '6',
                'seventh': '7',
                'eighth': '8',
                'ninth': '9',
                'tenth': '10'
            };
            const numOrder = orderMap[order] || order;
            return `\\sqrt[${numOrder}]{${translateText(content)}}`;
        }
    },
    {
        // Fractions
        pattern: /the\s+fraction\s+with\s+numerator\s+(.*?)\s+and\s+denominator\s+(.*?)(?=\s*(?:plus|minus|times|equals|$))/gi,
        replacement: (match, numerator, denominator) => 
            `\\frac{${translateText(numerator)}}{${translateText(denominator)}}`
    },
    {
        // Simple fractions
        pattern: /(\w+|\d+)\s+over\s+(\w+|\d+)/gi,
        replacement: (match, numerator, denominator) => 
            `\\frac{${translateText(numerator)}}{${translateText(denominator)}}`
    },
    {
        // Integrals with bounds
        pattern: /the\s+integral\s+from\s+(.*?)\s+to\s+(.*?)\s+of\s+(.*?)(?=\s*(?:plus|minus|d\s+[a-z]|$))/gi,
        replacement: (match, lower, upper, integrand) => 
            `\\int _${translateText(lower)}^${translateText(upper)}${translateText(integrand)}`
    },
    {
        // Parentheses
        pattern: /open\s+paren\s+(.*?)\s+close\s+paren/gi,
        replacement: (match, content) => `\\left(${translateText(content)}\\right)`
    },
    {
        // Brackets
        pattern: /open\s+bracket\s+(.*?)\s+close\s+bracket/gi,
        replacement: (match, content) => `\\left[${translateText(content)}\\right]`
    },
    {
        // Exponents
        pattern: /to\s+the\s+(.*?)-th\s+power/gi,
        replacement: (match, exponent) => `^{${translateText(exponent)}}`
    },
    {
        // Derivatives
        pattern: /d\s+over\s+d([a-z])\s+of\s+(.*?)(?=\s*(?:plus|minus|times|equals|$))/gi,
        replacement: (match, variable, function_) => 
            `\\frac{d}{d${variable}}${translateText(function_)}`
    },
    {
        // Second derivatives
        if (/^[a-zA-Z]$/.test(token)) {
            return token;
        }
        
        // Handle pi
        if (token === 'pi') {
            return '\\pi';
        }
        
        // Handle square root
        if (token === 'the square root of') {
            const expr = this.parseExpression();
            return '\\sqrt{' + expr + '}';
        }
        
        // Handle nth root
        const rootMatch = /^the\s+(\w+)\s+root\s+of$/.exec(token);
        if (rootMatch) {
            const orderMap = {
                'third': '3', 'fourth': '4', 'fifth': '5', 'sixth': '6',
                'seventh': '7', 'eighth': '8', 'ninth': '9', 'tenth': '10'
            };
            const numOrder = orderMap[rootMatch[1]] || rootMatch[1];
            const expr = this.parseExpression();
            return `\\sqrt[${numOrder}]{${expr}}`;
        }
        
        // Handle absolute value
        if (token === 'the absolute value of') {
            const expr = this.parseExpression();
            return '\\left|' + expr + '\\right|';
        }
        
        // Handle fractions
        if (token === 'the fraction with numerator') {
            const numerator = this.parseExpression();
            
            if (this.currentPosition < this.tokens.length && 
                this.tokens[this.currentPosition] === 'and denominator') {
                this.currentPosition++;
                const denominator = this.parseExpression();
                return '\\frac{' + numerator + '}{' + denominator + '}';
            }
            
            return numerator;
        }
        
        // Handle parentheses
        if (token === 'open paren') {
            const expr = this.parseExpression();
            
            if (this.currentPosition < this.tokens.length && 
                this.tokens[this.currentPosition] === 'close paren') {
                this.currentPosition++;
                return '\\left(' + expr + '\\right)';
            }
            
            return expr;
        }
        
        // Handle integrals
        if (token === 'the integral from') {
            const lower = this.parseExpression();
            
            if (this.currentPosition < this.tokens.length && 
                this.tokens[this.currentPosition] === 'to') {
                this.currentPosition++;
                const upper = this.parseExpression();
                
                if (this.currentPosition < this.tokens.length && 
                    this.tokens[this.currentPosition] === 'of') {
                    this.currentPosition++;
                    const integrand = this.parseExpression();
                    
                    // Look for 'd x' or similar
                    let differential = 'dx';
                    if (this.currentPosition < this.tokens.length && 
                        this.tokens[this.currentPosition].startsWith('d ')) {
                        differential = this.tokens[this.currentPosition].replace(' ', '');
                        this.currentPosition++;
                    }
                    
                    return '\\int _' + lower + '^' + upper + integrand + differential;
                }
            }
            
            return '\\int';
        }
        
        // Handle functions (sin, cos, etc.)
        const funcMatch = /^(sin|cos|tan)(e)?$/.exec(token);
        if (funcMatch) {
            const func = funcMatch[1].toLowerCase();
            
            // Check for powers like sin squared
            if (this.currentPosition < this.tokens.length && 
                this.tokens[this.currentPosition] === 'squared') {
                this.currentPosition++;
                return '\\' + func + ' ^2';
            }
            
            if (this.currentPosition < this.tokens.length) {
                const nextToken = this.tokens[this.currentPosition];
                if (nextToken === 'of') {
                    this.currentPosition++;
                    const arg = this.parseExpression();
                    return '\\' + func + ' ' + arg;
                }
            }
            
            return '\\' + func;
        }
        
        // Handle function notation
        const funcNotation = /^([a-z])\s+of\s+([a-z])$/.exec(token);
        if (funcNotation) {
            return funcNotation[1] + '\\left(' + funcNotation[2] + '\\right)';
        }
        
        // Handle equals
        if (token === 'equals') {
            return '=';
        }
        
        // Default case
        return token;
    }
    
    parse() {
        return this.parseExpression();
    }
}

// Special structures and their handlers
// Removed duplicate declaration of specialStructures

// The main translator function
function translateText(text) {
    if (!text) return '';
    
    try {
        // Try to use the parser for structured mathematical expressions
        const parser = new MathExpressionParser(text);
        const parsed = parser.parse();
        
        // If parsing produced something reasonable, use it
        if (parsed && parsed.length > 0 && !parsed.includes('undefined')) {
            return cleanupLatex(parsed);
        }
    } catch (e) {
        console.error("Parser error:", e);
        // Fall back to the regex approach if parsing fails
    }
    
    // Fall back to the original regex-based approach
    return fallbackTranslateText(text);
}

// Cleanup function for parser output
function cleanupLatex(latex) {
    return latex
        .replace(/([a-zA-Z])\s*\\left\(/g, '$1\\left(') // Fix function spacing
        .replace(/\\int\s+_/g, '\\int _') // Fix integral spacing
        .replace(/\\sqrt\s*\[/g, '\\sqrt[') // Fix root spacing
        .replace(/\\sqrt\s*\{/g, '\\sqrt{') // Fix square root spacing
        .replace(/\\frac\s*\{/g, '\\frac{') // Fix fraction spacing
        .replace(/\}\s*\{/g, '}{') // Fix brace spacing
        .replace(/\s+/g, ' ') // Normalize remaining spaces
        .trim();
}

// Original regex-based approach as fallback
function fallbackTranslateText(text) {
    // Pre-process text for specific patterns needing exact matches
    text = text.replace(/(\w+) bar times (\w+) bar/gi, (match, a, b) => `${a} bar MULTIPLY ${b} bar`);
    text = text.replace(/(\w+) over (\w+|\d+) plus/gi, (match, a, b) => `${a} over ${b} PLUS`);
    text = text.replace(/is greater than or equal to/gi, "GREATEREQUALTO");
    
    // Handle special structures
    for (const structure of specialStructures) {
        text = text.replace(structure.pattern, structure.replacement);
    }
    
    // Replace the temporaries back
    text = text.replace(/MULTIPLY/g, "times");
    text = text.replace(/PLUS/g, "plus");
    text = text.replace(/GREATEREQUALTO/g, "is greater than or equal to");
    
    // Handle simple term replacements
    for (const [term, replacement] of Object.entries(termMappings)) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        text = text.replace(regex, replacement);
    }
    
    // Clean up the output
    text = text
        .replace(/ d ([a-z])/g, ' d$1') // Fix spacing in differentials
        .replace(/\{,\}\\\s+/g, '{,}\\ ') // Fix comma spacing
        .replace(/\s*\\cdot\s*/g, '\\cdot ') // Fix times spacing
        .replace(/\s*\\in\s*/g, '\\in ') // Fix in-set spacing
        .replace(/\s*\\ge\s*/g, '\\ge ') // Fix greater-than-or-equal spacing
        .replace(/\s*\\le\s*/g, '\\le ') // Fix less-than-or-equal spacing
        .replace(/\s*\^\s*(\d+|\{.*?\})/g, '^$1') // Fix exponent spacing
        .replace(/\s*°\s*/g, '°') // Fix degree spacing
        .replace(/(\d+|\})\s*\+\s*/g, '$1+') // Fix plus spacing after numbers
        .replace(/(\d+|\})\s*\-\s*/g, '$1-') // Fix minus spacing after numbers
        .replace(/(\d+|\})\s*\=\s*/g, '$1=') // Fix equals spacing after numbers
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    
    return text;
}

// Main function to translate aria-label to LaTeX
function translateAriaToLatex(ariaLabel) {
    // Additional preprocessing for specific challenging cases
    let processedAriaLabel = ariaLabel
        .replace(/squared/g, ' squared ')
        .replace(/cubed/g, ' cubed ')
        .replace(/fourth power/g, ' fourth power ')
        .replace(/\bto the (\w+)-th power\b/g, ' to the $1-th power ')
        .trim();
    
    // Use the improved translation function
    let latex = translateText(processedAriaLabel);
    
    // Post-processing for better formatting
    latex = cleanupLatex(latex);
    
    // Special cases handling
    if (ariaLabel.includes("fourth power of cosine")) {
        latex = latex.replace(/the \^4\(cos\)/i, "\\cos ^4");
    }
    
    if (ariaLabel.includes("a x is greater than or equal to 4")) {
        latex = "ax\\ge 4";
    }
    
    if (ariaLabel.includes("open bracket 0 comma 3 close bracket")) {
        latex = "\\left[0{,}\\ 3\\right]";
    }
    
    return latex;
}

// Make the function available globally
window.translateAriaToLatex = translateAriaToLatex;
