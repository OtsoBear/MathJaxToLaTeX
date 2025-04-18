/**
 * MathML to LaTeX Translator
 * This file contains all functions for converting MathML to LaTeX
 */

// Track recursion to avoid duplicate logs
let conversionInProgress = false;
let loggedExpression = false;

// Main conversion function
function convertMathMLToLatex(node) {
    const nodeType = node.getAttribute ? node.getAttribute('data-mml-node') : 'none';
    
    // Only log at the top level of recursion
    const isTopLevel = !conversionInProgress;
    
    if (isTopLevel) {
        conversionInProgress = true;
        loggedExpression = false;
        
        // Try to get the aria-label from closest MathJax container
        try {
            const mjxContainer = node.closest('mjx-container');
            if (mjxContainer && mjxContainer.getAttribute('aria-label') && !loggedExpression) {
                const ariaLabel = mjxContainer.getAttribute('aria-label');
                console.log('[INPUT] Math expression: "' + ariaLabel + '"');
                loggedExpression = true;
            }
        } catch(e) {
            // Ignore errors in accessing aria-label
        }
        
        console.log('[INFO] Translating...');
    }
    
    // Remove all special case handling - we'll use a general approach
    if (!node) {
        if (isTopLevel) conversionInProgress = false;
        return '';
    }
    
    // Skip certain nodes
    if (node.nodeType !== 1) { // Not an element node
        if (isTopLevel) conversionInProgress = false;
        return node.nodeType === 3 ? node.textContent.trim() : '';
    }
    
    // Skip non-content elements
    if (node.tagName.toLowerCase() === 'use' || 
        node.tagName.toLowerCase() === 'rect') {
        if (isTopLevel) conversionInProgress = false;
        return '';
    }
    
    // Handle based on node type
    if (!nodeType) {
        const result = processChildren(node);
        if (isTopLevel) conversionInProgress = false;
        return result;
    }
    
    let result = '';
    
    switch (nodeType) {
        case 'math':
            // First check for data-semantic attributes
            result = processChildren(node);
            if (isTopLevel) {
                console.log('[INFO] MathJax to LaTeX conversion completed successfully');
                conversionInProgress = false;
            }
            return result;
        
        case 'mrow':
            // For equation patterns (like function applications), we need to handle them properly
            if (node.getAttribute && node.getAttribute('data-semantic-role') === "equality") {
                // This is an equation with equals sign
                const children = Array.from(node.children || []);
                
                // Find the equals sign to split left and right sides
                let equalsIndex = -1;
                for (let i = 0; i < children.length; i++) {
                    if (children[i].getAttribute('data-mml-node') === 'mo' && 
                        getNodeContent(children[i]) === '=') {
                        equalsIndex = i;
                        break;
                    }
                }
                
                if (equalsIndex > 0) {
                    const leftSide = children.slice(0, equalsIndex);
                    const rightSide = children.slice(equalsIndex + 1);
                    
                    const leftLatex = leftSide.map(child => convertMathMLToLatex(child)).join('');
                    const rightLatex = rightSide.map(child => convertMathMLToLatex(child)).join('');
                    
                    // Only log at the top level to avoid duplicate logs
                    if (isTopLevel) {
                        console.log('[PROGRESS] Processed equation with left and right sides');
                    }
                    
                    if (isTopLevel) conversionInProgress = false;
                    return leftLatex + '=' + rightLatex;
                }
            }

            // Check if this mrow represents a function application
            if (isImplicitFunction(node)) {
                const func = node.querySelector('[data-mml-node="mi"]');
                const arg = node.querySelector('[data-mml-node="mrow"]');
                
                if (func && arg) {
                    // Process the argument properly to avoid double parentheses
                    const processedArg = processArgumentParentheses(arg);
                    result = convertMathMLToLatex(func) + processedArg;
                    if (isTopLevel) conversionInProgress = false;
                    return result;
                }
            }
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
        
        case 'mi':
            // Handle identifiers
            const mi = getNodeContent(node);
            // Check if this is a standard math function
            if (isStandardFunction(mi)) {
                return '\\' + mi;
            }
            
            // Check if it's part of a function name (like 'c' for cos, 's' for sin)
            if (node.parentNode && 
                (['cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'].some(fn => 
                fn[0] === mi.toLowerCase() && node.parentNode.textContent.startsWith(fn)))) {
                return mi;
            }
            
            return mi;
        
        case 'mn':
            // Handle numbers
            const number = getNodeContent(node);
            return number;
        
        case 'mo':
            // Handle operators
            const op = getNodeContent(node);
            switch (op) {
                case '=': return '=';
                case '+': return '+';
                case '-': return '-';
                case '×': return '\\times';
                case '÷': return '\\div';
                case '|': 
                    // Check for absolute value context
                    if (isStartOfAbsValue(node)) {
                        return '\\left|';
                    } else if (isEndOfAbsValue(node)) {
                        return '\\right|';
                    }
                    return '|';
                case '(': 
                    return '\\left(';
                case ')': 
                    return '\\right)';
                case '\'': return '\'';
                case '′': return '\'';  // Unicode prime
                default: return op;
            }
        
        case 'mtext':
            // Handle text elements
            const text = getNodeContent(node);
            if (text === 'π') return '\\pi';
            if (text === 'd') return 'd';
            return text;
        
        case 'msqrt':
            // Improved square root handling - directly process the radicand
            return processMsqrt(node);
        
        case 'mfrac':
            // Handle fractions
            if (node.children.length >= 2) {
                const num = node.children[0];
                const den = node.children[1];
                const numLatex = convertMathMLToLatex(num);
                const denLatex = convertMathMLToLatex(den);
                
                // Only log at the top level to avoid duplicate logs
                if (isTopLevel) {
                    console.log('[PROGRESS] Processed fraction');
                }
                
                if (isTopLevel) conversionInProgress = false;
                return '\\frac{' + numLatex + '}{' + denLatex + '}';
            }
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
        
        case 'msup':
            // Handle superscripts
            if (node.children.length >= 2) {
                const base = node.children[0];
                const exp = node.children[1];
                
                // Process the base carefully to avoid double parentheses
                let baseText;
                if (isParenthesizedExpression(base)) {
                    // If base already has parentheses, process it specially
                    baseText = processParenthesizedExpression(base);
                } else {
                    baseText = convertMathMLToLatex(base);
                }
                
                const expText = convertMathMLToLatex(exp);
                
                // Check if base needs parentheses
                const needsParens = isCompoundElement(base) && !isParenthesizedExpression(base);
                
                // Special case for squared
                if (expText === '2') {
                    return needsParens ? 
                        '(' + baseText + ')^2' : 
                        baseText + '^2';
                }
                return needsParens ? 
                    '(' + baseText + ')^{' + expText + '}' : 
                    baseText + '^{' + expText + '}';
            }
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
        
        case 'msub':
            // Handle subscripts
            if (node.children.length >= 2) {
                const baseSub = node.children[0];
                const sub = node.children[1];
                const baseSubLatex = convertMathMLToLatex(baseSub);
                const subLatex = convertMathMLToLatex(sub);
                return baseSubLatex + '_{' + subLatex + '}';
            }
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
        
        case 'munderover':
            // Handle elements with under and over scripts (like integrals)
            if (node.children.length >= 3) {
                const baseOp = node.children[0];
                const underScript = node.children[1];
                const overScript = node.children[2];
                
                const baseOpContent = getNodeContent(baseOp);
                const underLatex = convertMathMLToLatex(underScript);
                const overLatex = convertMathMLToLatex(overScript);
                
                // Special case for integral
                if (baseOpContent === '∫') {
                    // Only log at the top level to avoid duplicate logs
                    if (isTopLevel) {
                        console.log('[PROGRESS] Processed integral');
                    }
                    return '\\int_{' + underLatex + '}^{' + overLatex + '}';
                }
                
                return convertMathMLToLatex(baseOp) + '_{' + underLatex + '}^{' + overLatex + '}';
            }
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
        
        case 'mstyle':
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
        
        default:
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
    }
}

function processChildren(node) {
    // Initialize variables at the beginning of the function
    let result = '';
    let skipNext = false;
    
    // Check for function node with data-semantic-role="prefix function"
    if (node.getAttribute && node.getAttribute('data-semantic-role') === 'prefix function') {
        // Find the function name node (typically has data-semantic-type="function")
        const funcNode = node.querySelector('[data-semantic-type="function"]');
        if (funcNode) {
            const funcName = funcNode.textContent.toLowerCase().trim();
            
            // Get the function argument (usually the next node)
            const argNode = Array.from(node.childNodes).find(child => 
                child.getAttribute && 
                child.getAttribute('data-semantic-type') !== 'function' &&
                child.getAttribute('data-semantic-type') !== 'punctuation');
            
            const arg = argNode ? convertMathMLToLatex(argNode) : 'x';
            
            // Map function name to LaTeX
            if (funcName === 'cos' || funcName.includes('cos')) return `\\cos ${arg}`;
            if (funcName === 'sin' || funcName.includes('sin')) return `\\sin ${arg}`;
            if (funcName === 'tan' || funcName.includes('tan')) return `\\tan ${arg}`;
            if (funcName === 'cot' || funcName.includes('cot')) return `\\cot ${arg}`;
            if (funcName === 'sec' || funcName.includes('sec')) return `\\sec ${arg}`;
            if (funcName === 'csc' || funcName.includes('csc')) return `\\csc ${arg}`;
            if (funcName === 'log' || funcName.includes('log')) return `\\log ${arg}`;
            if (funcName === 'ln' || funcName.includes('ln')) return `\\ln ${arg}`;
        }
    }
    
    // Regular processing for functions and other math expressions
    if (node.textContent) {
        const fullText = node.textContent.trim().toLowerCase();
        
        // General function pattern detection
        for (const func of ['cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'log', 'ln']) {
            if (isFunctionNode(node, func)) {
                const arg = getArgumentAfterFunction(node, func);
                return '\\' + func + ' ' + arg;
            }
        }
    }
    
    // Regular processing for children nodes
    let possibleFunction = '';
    
    for (let i = 0; i < node.childNodes.length; i++) {
        if (skipNext) {
            skipNext = false;
            continue;
        }
        
        const child = node.childNodes[i];
        
        // Try to detect if this is the start of a function name (like 'sin', 'cos', etc.)
        if (child.nodeType === 1 && 
            child.getAttribute && 
            child.getAttribute('data-mml-node') === 'mi') {
            
            // Get the current character/identifier
            const currentChar = getNodeContent(child).toLowerCase();
            
            // Check if this might be the start of a known function
            const functionNames = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'];
            const possibleFunctions = functionNames.filter(fn => fn.startsWith(currentChar));
            
            if (possibleFunctions.length > 0) {
                // Try to construct a function name from consecutive nodes
                const functionResult = tryBuildFunctionName(node, i, functionNames);
                
                if (functionResult.isFunction) {
                    result += functionResult.latex;
                    i += functionResult.skipCount;
                    continue;
                }
            }
        }
        
        // Check for prime symbol after an identifier
        if (i > 0 && 
            node.childNodes[i-1].getAttribute && 
            node.childNodes[i-1].getAttribute('data-mml-node') === 'mi' &&
            child.getAttribute && 
            child.getAttribute('data-mml-node') === 'mo' && 
            getNodeContent(child) === '′') {
            result += "'"; // Add prime symbol to previous element
            continue;
        } 
        
        // Skip invisible operators 
        if (child.getAttribute && 
            child.getAttribute('data-mml-node') === 'mo' && 
            isInvisibleOperator(child)) {
            continue;
        }
        
        const childResult = convertMathMLToLatex(child);
        result += childResult;
    }
    
    return result;
}

function isFunctionNode(node, functionName) {
    if (!node || !node.textContent) return false;
    
    // Direct text content check
    if (node.textContent.toLowerCase().includes(functionName)) {
        return true;
    }
    
    // Check for data-semantic-type="function"
    if (node.getAttribute && node.getAttribute('data-semantic-type') === "function") {
        return true;
    }
    
    // Check for specific semantic role
    if (node.getAttribute && node.getAttribute('data-semantic-role') === "prefix function") {
        return true;
    }
    
    return false;
}

function processMsqrt(node) {
    // The radicand is the content under the square root
    let radicand = '';
    
    // Check if there's an explicit mrow inside the msqrt
    const mrowElement = node.querySelector('[data-mml-node="mrow"]');
    if (mrowElement) {
        // Process the mrow directly
        radicand = convertMathMLToLatex(mrowElement);
    } else {
        // Otherwise, process all direct children
        for (const child of node.children) {
            // Skip the square root symbol itself and the rectangle
            if (child.tagName.toLowerCase() === 'g' && 
                child.getAttribute('data-mml-node') !== 'mo') {
                radicand += convertMathMLToLatex(child);
            } else if (child.tagName.toLowerCase() !== 'rect' && 
                       child.tagName.toLowerCase() !== 'mo' &&
                       !child.querySelector('use[data-c="221A"]')) {
                radicand += convertMathMLToLatex(child);
            }
        }
    }
    
    // Clean up any trailing square root text
    radicand = radicand.replace(/\\sqrt$/, '');
    radicand = radicand.replace(/\\sqrt\{\}$/, '');
    radicand = radicand.replace(/\s*\\sqrt\s*/, '');
    
    // Only log at the top level to avoid duplicate logs
    if (!conversionInProgress) {
        console.log('[PROGRESS] Processed square root');
    }
    
    return '\\sqrt{' + radicand + '}';
}

function isInvisibleOperator(node) {
    if (!node) return false;
    
    // Check if this is an invisible operator (application or times)
    const useElem = node.querySelector('use');
    if (useElem) {
        const dataC = useElem.getAttribute('data-c');
        return dataC === '2061' || dataC === '2062'; // Function application or invisible times
    }
    
    return false;
}

function getNodeContent(node) {
    // Special case for function nodes - handle multi-character functions like 'cos', 'sin'
    if (node.getAttribute && node.getAttribute('data-semantic-type') === 'function') {
        const nodeText = node.textContent.trim().toLowerCase();
        // Check known functions
        if (nodeText.includes('cos') || nodeText === 'cos') return '\\cos';
        if (nodeText.includes('sin') || nodeText === 'sin') return '\\sin';
        if (nodeText.includes('tan') || nodeText === 'tan') return '\\tan';
        if (nodeText.includes('cot') || nodeText === 'cot') return '\\cot';
        if (nodeText.includes('sec') || nodeText === 'sec') return '\\sec';
        if (nodeText.includes('csc') || nodeText === 'csc') return '\\csc';
        if (nodeText.includes('log') || nodeText === 'log') return '\\log';
        if (nodeText.includes('ln') || nodeText === 'ln') return '\\ln';
    }
    
    // Check if this is a multi-character node (with separate USE elements)
    if (node.nodeName.toLowerCase() === 'g' && node.childNodes.length > 1) {
        const useNodes = Array.from(node.querySelectorAll('use[data-c]'));
        
        if (useNodes.length > 1) {
            // Extract all characters from data-c attributes and combine them
            const fullText = extractAllCharacters(useNodes);
            
            // Check if it's a number
            if (/^\d+$/.test(fullText)) {
                return fullText; // Return the full multi-digit number
            }
            
            // Check if these characters form a known function
            const combinedText = fullText.toLowerCase();
            if (combinedText === 'cos') return '\\cos';
            if (combinedText === 'sin') return '\\sin';
            if (combinedText === 'tan') return '\\tan';
            if (combinedText === 'cot') return '\\cot';
            if (combinedText === 'sec') return '\\sec';
            if (combinedText === 'csc') return '\\csc';
            if (combinedText === 'log') return '\\log';
            if (combinedText === 'ln') return '\\ln';
            
            return fullText;
        }
    }
    
    // Try to get text content directly
    if (node.textContent) {
        const content = node.textContent.trim();
        // Check for special characters in text
        if (content === 'π') return '\\pi';
        if (content === '′') return '\''; // Unicode prime
        
        // Check if this is a known function name
        if (isStandardFunction(content)) {
            return '\\' + content;
        }
        
        return content;
    }
    
    // Handle special cases for elements with 'text' tag
    const textElem = node.querySelector('text');
    if (textElem) {
        const content = textElem.textContent.trim();
        if (content === 'π') return '\\pi';
        if (content === 'd') return 'd';
        if (content === '′') return '\''; // Unicode prime
        return content;
    }
    
    // Handle uses of glyphs by data-c attribute
    const useElem = node.querySelector('use');
    if (useElem) {
        const dataC = useElem.getAttribute('data-c');
        
        // Special handling for function names by checking concatenated sequences
        if (isFunctionNameStart(node)) {
            return getFunctionNameFromSequence(node);
        }
        
        // Handle invisible operators specially to avoid showing Unicode points
        if (dataC === '2061' || dataC === '2062') {
            return ''; // Return empty string for invisible operators
        }
        
        // Get the Unicode character mapping using our unicode_to_tex mapping
        return getUnicodeMapping(dataC);
    }
    
    // Handle special cases for mathematical functions
    if (node.nodeName.toLowerCase() === 'mi' && node.getAttribute('data-semantic-type') === 'function') {
        const content = node.textContent.trim().toLowerCase();
        if (content === 'cos' || content.includes('cos')) {
            return '\\cos ';
        }
        if (content === 'sin' || content.includes('sin')) {
            return '\\sin ';
        }
    }
    
    return '';
}

/**
 * Extracts all characters from a set of 'use' nodes and combines them
 * into a single string, handling common patterns like multi-digit numbers
 * @param {Array} useNodes - Array of 'use' elements with data-c attributes
 * @return {string} The combined string of all extracted characters
 */
function extractAllCharacters(useNodes) {
    if (!useNodes || useNodes.length === 0) return '';
    
    // Get all the characters and sort them by x position if available
    const charData = useNodes.map(useNode => {
        const codePoint = useNode.getAttribute('data-c');
        const char = String.fromCharCode(parseInt(codePoint, 16));
        
        // Try to get X position for proper ordering
        let x = 0;
        try {
            // Find closest element with x attribute
            let element = useNode;
            while (element && !element.getAttribute('x')) {
                element = element.parentElement;
            }
            // Parse x position if found
            if (element && element.getAttribute('x')) {
                x = parseFloat(element.getAttribute('x'));
            }
        } catch (e) {
            console.log('[WARNING] Error getting element position');
        }
        
        return { char, x, codePoint };
    });
    
    // Sort by x position if available to maintain proper order
    charData.sort((a, b) => a.x - b.x);
    
    // Combine all characters
    return charData.map(c => c.char).join('');
}

function getUnicodeMapping(codePoint) {
    // Format the codePoint to match the unicode_to_tex format (U+XXXX)
    const formattedCodePoint = "U+" + codePoint.toUpperCase().padStart(4, '0');
    
    // Try to get the mapping from the unicode_to_tex object
    if (typeof unicode_to_tex !== 'undefined' && unicode_to_tex[formattedCodePoint]) {
        return unicode_to_tex[formattedCodePoint];
    }
    
    // Fallback mappings for basic cases
    // Number mappings (0-9)
    const numbers = {
        '30': '0', '31': '1', '32': '2', '33': '3', '34': '4',
        '35': '5', '36': '6', '37': '7', '38': '8', '39': '9'
    };
    
    if (numbers[codePoint]) {
        return numbers[codePoint];
    }
    
    // Check if it's a plain ASCII uppercase or lowercase letter
    const codePointInt = parseInt(codePoint, 16);
    if (codePointInt >= 0x41 && codePointInt <= 0x5A) { // A-Z
        return String.fromCharCode(codePointInt);
    }
    if (codePointInt >= 0x61 && codePointInt <= 0x7A) { // a-z
        return String.fromCharCode(codePointInt);
    }
    
    // If no mapping was found, log the unknown code point and return a placeholder
    console.log('[WARNING] Unknown Unicode character detected');
    return `[U+${codePoint}]`;
}

function isStandardFunction(name) {
    const standardFunctions = [
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc',
        'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
        'log', 'ln', 'exp', 'lim', 'max', 'min',
        'sup', 'inf'
    ];
    
    return standardFunctions.includes(name.toLowerCase());
}

function isFunctionNameStart(node) {
    // Check if this node is part of a recognized function name sequence
    const parent = node.parentNode;
    if (!parent) return false;
    
    // Try to extract a potential function name
    const potentialFunction = getTextContent(parent);
    return isStandardFunction(potentialFunction);
}

function getFunctionNameFromSequence(startNode) {
    // Look for a sequence of characters that form a function name
    const parent = startNode.parentNode;
    if (!parent) return '';
    
    const textContent = getTextContent(parent);
    if (isStandardFunction(textContent)) {
        return '\\' + textContent;
    }
    
    return '';
}

function getTextContent(node) {
    if (!node || !node.textContent) return '';
    return node.textContent.trim();
}

function isStartOfAbsValue(node) {
    // Check if this is the first '|' in a pair
    const op = getNodeContent(node);
    if (op !== '|') return false;
    
    // Look for parent with mrow and check if it's a fenced structure
    const parent = findParentWithType(node, 'mrow');
    if (!parent) return false;
    
    const verticalBars = Array.from(parent.querySelectorAll('[data-mml-node="mo"]'))
        .filter(n => getNodeContent(n) === '|');
    
    if (verticalBars.length !== 2) return false;
    return verticalBars[0] === node;
}

function isEndOfAbsValue(node) {
    // Check if this is the second '|' in a pair
    const op = getNodeContent(node);
    if (op !== '|') return false;
    
    // Look for parent with mrow and check if it's a fenced structure
    const parent = findParentWithType(node, 'mrow');
    if (!parent) return false;
    
    const verticalBars = Array.from(parent.querySelectorAll('[data-mml-node="mo"]'))
        .filter(n => getNodeContent(n) === '|');
    
    if (verticalBars.length !== 2) return false;
    return verticalBars[1] === node;
}

function findParentWithType(node, type) {
    let current = node.parentNode;
    while (current) {
        if (current.getAttribute && current.getAttribute('data-mml-node') === type) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}

function isCompoundElement(node) {
    // Check if node contains multiple operators or elements
    if (!node) return false;
    
    // Check if it's a parenthesized expression
    if (node.getAttribute && node.getAttribute('data-mml-node') === 'mrow') {
        const children = Array.from(node.children);
        // Check if this is a fenced expression with parentheses
        const hasOpenParen = children.some(c => 
            c.getAttribute('data-mml-node') === 'mo' && 
            getNodeContent(c) === '(');
            
        const hasCloseParen = children.some(c => 
            c.getAttribute('data-mml-node') === 'mo' && 
            getNodeContent(c) === ')');
            
        if (hasOpenParen && hasCloseParen) {
            return true;
        }
    }
    
    return false;
}

function isImplicitFunction(node) {
    // Check if this mrow represents a function application
    if (!node || node.getAttribute('data-mml-node') !== 'mrow') return false;
    
    const children = Array.from(node.children || []);
    if (children.length < 2) return false;
    
    // Look for 'mi' element followed by either application operator or mrow with parentheses
    const firstChild = children[0];
    const isFunctionName = firstChild && 
        firstChild.getAttribute('data-mml-node') === 'mi';
    
    if (!isFunctionName) return false;
    
    // Check for application operator or direct parentheses
    for (let i = 1; i < children.length; i++) {
        const child = children[i];
        
        // Check if it's an application operator (more robust check)
        if (child.getAttribute && child.getAttribute('data-mml-node') === 'mo' && 
            ((child.querySelector && child.querySelector('use[data-c="2061"]')) || 
             getNodeContent(child) === '')) {
            return true;
        }
        
        // Check if it's a parenthesized argument
        if (child.getAttribute('data-mml-node') === 'mrow') {
            const grandChildren = Array.from(child.children || []);
            if (grandChildren.length > 0 && 
                grandChildren[0].getAttribute('data-mml-node') === 'mo' && 
                getNodeContent(grandChildren[0]) === '(') {
                return true;
            }
        }
    }
    
    return false;
}

function processArgumentParentheses(node) {
    if (!node) return '';
    
    // Check if this is already a parenthesized expression
    const children = Array.from(node.children || []);
    
    // Look for opening and closing parentheses at the outermost level
    const firstChild = children.length > 0 ? children[0] : null;
    const lastChild = children.length > 0 ? children[children.length - 1] : null;
    
    const hasOpeningParen = firstChild && 
        firstChild.getAttribute('data-mml-node') === 'mo' && 
        getNodeContent(firstChild) === '(';
        
    const hasClosingParen = lastChild && 
        lastChild.getAttribute('data-mml-node') === 'mo' && 
        getNodeContent(lastChild) === ')';
    
    if (hasOpeningParen && hasClosingParen) {
        // This is already a parenthesized expression
        // Process the inner content directly without adding extra parentheses
        const innerContent = processInnerContent(children.slice(1, -1));
        return '(' + innerContent + ')';
    } else {
        // Not already parenthesized, process normally and add parentheses
        return '(' + convertMathMLToLatex(node) + ')';
    }
}

function processInnerContent(children) {
    return children.map(child => convertMathMLToLatex(child)).join('');
}

function isParenthesizedExpression(node) {
    if (!node || node.getAttribute('data-mml-node') !== 'mrow') return false;
    
    const children = Array.from(node.children || []);
    if (children.length < 2) return false;
    
    const firstChild = children[0];
    const lastChild = children[children.length - 1];
    
    return firstChild.getAttribute('data-mml-node') === 'mo' && 
           getNodeContent(firstChild) === '(' &&
           lastChild.getAttribute('data-mml-node') === 'mo' && 
           getNodeContent(lastChild) === ')';
}

function processParenthesizedExpression(node) {
    const children = Array.from(node.children || []);
    // Skip first and last children (the parentheses)
    const innerContent = processInnerContent(children.slice(1, -1));
    return '(' + innerContent + ')';
}

function isFunctionNameSequence(node, startIndex) {
    if (!node.childNodes || startIndex >= node.childNodes.length - 1) return false;
    
    // Try to get the next few nodes' text content
    let combinedText = '';
    const maxLength = Math.min(node.childNodes.length, startIndex + 4); // Look ahead up to 4 chars
    
    for (let i = startIndex; i < maxLength; i++) {
        const child = node.childNodes[i];
        if (child.textContent) {
            combinedText += child.textContent.trim();
        }
    }
    
    return isStandardFunction(combinedText);
}

function tryBuildFunctionName(node, startIndex, functionNames) {
    // Default return value if no function is found
    let result = { isFunction: false, latex: '', skipCount: 0 };
    
    // If no node or invalid start index, return default
    if (!node || !node.childNodes || startIndex >= node.childNodes.length) {
        return result;
    }
    
    // Try to build a function name by examining consecutive nodes
    let potentialName = '';
    let nodeCount = 0;
    
    // Look ahead at up to 4 nodes
    for (let i = 0; i < 4 && (startIndex + i) < node.childNodes.length; i++) {
        const childNode = node.childNodes[startIndex + i];
        
        // Skip non-element nodes or nodes without content
        if (childNode.nodeType !== 1 || !childNode.textContent) {
            continue;
        }
        
        // Get content and append to potential name
        let content = '';
        if (childNode.getAttribute && childNode.getAttribute('data-mml-node') === 'mi') {
            content = getNodeContent(childNode).toLowerCase();
        } else if (childNode.textContent) {
            content = childNode.textContent.trim().toLowerCase();
        }
        
        if (content) {
            potentialName += content;
            nodeCount = i + 1; // Count of nodes to skip later
            
            // Check if we've found a complete function name
            if (functionNames.includes(potentialName)) {
                return {
                    isFunction: true,
                    latex: '\\' + potentialName + ' ',
                    skipCount: nodeCount - 1 // Skip count should be nodes after the current one
                };
            }
            
            // If we've built something that doesn't match any function prefix, break
            const stillPossible = functionNames.some(fn => fn.startsWith(potentialName));
            if (!stillPossible) {
                break;
            }
        }
    }
    
    // Didn't find a matching function
    return result;
}
        
function extractFunctionName(node, startIndex) {
    if (!node.childNodes) return { name: '', skipCount: 0 };
    
    const standardFunctions = [
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'arccot',
        'sinh', 'cosh', 'tanh', 'coth',
        'log', 'ln', 'exp', 'lim', 'max', 'min'
    ];
    
    let combinedText = '';
    let skipCount = 0;
    
    // Try combinations of increasing length
    for (let ahead = 0; startIndex + ahead < node.childNodes.length && ahead < 6; ahead++) {
        const child = node.childNodes[startIndex + ahead];
        if (child.textContent) {
            combinedText += child.textContent.trim();
        }
        
        // If we have a match with a standard function
        if (standardFunctions.includes(combinedText.toLowerCase())) {
            return { name: '\\' + combinedText.toLowerCase() + ' ', skipCount: ahead };
        }
    }
    
    return { name: '', skipCount: 0 };
}

function handleSpecialFunctions(content, node) {
    // If we have a parent node, check if the content fits a pattern 
    // that suggests it's part of a function name
    if (node && node.parentNode) {
        const parentContent = node.parentNode.textContent.trim().toLowerCase();
        
        // Check for common function patterns
        if (parentContent.startsWith('sin') && content === 's') {
            return '\\sin ';
        }
        if (parentContent.startsWith('cos') && content === 'c') {
            return '\\cos ';
        }
        if (parentContent.startsWith('tan') && content === 't') {
            return '\\tan ';
        }
        // And more for other functions...
    }
    
    return content;
}

function isFunctionContext(text) {
    if (!text) return false;
    text = text.toLowerCase();
    
    const mathFunctions = [
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'arccot', 'log', 'ln'
    ];
    
    return mathFunctions.some(fn => text.includes(fn));
}

function extractArgument(node, functionName) {
    if (!node || !node.textContent) return '';
    
    // We need to find all content after the function name
    const nodeText = node.textContent.toLowerCase();
    const startIndex = nodeText.indexOf(functionName) + functionName.length;
    
    // Get remaining text after function name
    const restOfContent = node.textContent.substring(startIndex).trim();
    
    // For simple cases (like just "x"), return directly
    if (restOfContent.length === 1 && /[a-z]/i.test(restOfContent)) {
        return restOfContent;
    }
    
    // Try to find identifiers or other content after the function name
    // This is simplified - more complex arguments would need better parsing
    const match = restOfContent.match(/^([a-zA-Z0-9]+)/);
    if (match) {
        return match[1];
    }
    
    return restOfContent;
}

function findFunctionNode(parentNode, functionName) {
    if (!parentNode || !parentNode.querySelectorAll) return null;
    
    // Look for text nodes containing the function name
    for (let child of parentNode.childNodes) {
        if (child.textContent && child.textContent.toLowerCase().includes(functionName)) {
            return child;
        }
    }
    
    // Look for the specific structure with individual letters (c, o, s) or (s, i, n)
    if (functionName === "cos") {
        const cNodes = parentNode.querySelectorAll('[data-c="63"]');
        if (cNodes.length > 0) {
            // Found a 'c', now check for 'o' and 's' nearby
            return parentNode;
        }
    }
    
    if (functionName === "sin") {
        const sNodes = parentNode.querySelectorAll('[data-c="73"]');
        if (sNodes.length > 0) {
            // Found an 's', now check for 'i' and 'n' nearby
            return parentNode;
        }
    }
    
    return null;
}

function getArgumentAfterFunction(node, functionName) {
    if (!node || !node.textContent) return 'x';  // Default to 'x' if no text content
    
    const text = node.textContent.toLowerCase();
    const startIndex = text.indexOf(functionName) + functionName.length;
    const remaining = text.substring(startIndex).trim();
    
    // If remaining is just x, return it
    if (remaining === 'x') return 'x';
    
    // Try to extract the first variable after the function name
    const match = remaining.match(/([a-z]|\([^)]*\))/i);
    if (match) return match[0];
    
    return 'x'; // Default
}

function debugNode(node, prefix = '') {
    if (!node) {
        return;
    }
    
    const type = node.nodeType;
    const nodeName = node.nodeName;
    const mmlType = node.getAttribute ? node.getAttribute('data-mml-node') : null;
    const text = node.textContent ? node.textContent.substring(0, 30) : '';
    
    console.log('[DEBUG] ' + prefix + `Node: ${mmlType || nodeName}, text="${text}"`);
}

// Export the functions that need to be called from the HTML file
window.convertMathMLToLatex = convertMathMLToLatex;
window.debugNode = debugNode;
