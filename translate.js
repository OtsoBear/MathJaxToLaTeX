/**
 * MathML to LaTeX Translator
 * This file contains all functions for converting MathML to LaTeX
 */

// Track recursion to avoid duplicate logs
let conversionInProgress = false;
let loggedExpression = false;

// Main conversion function
function convertMathMLToLatex(node) {
    // Check if this is CHTML format instead of SVG format
    if (isCHTMLFormat(node)) {
        const isTopLevel = !conversionInProgress;
        
        if (isTopLevel) {
            conversionInProgress = true;
            loggedExpression = false;
            
            // Try to get the aria-label from the MathJax container
            try {
                if (node.getAttribute && node.getAttribute('aria-label') && !loggedExpression) {
                    const ariaLabel = node.getAttribute('aria-label');
                    console.log('[INPUT] Math expression: "' + ariaLabel + '"');
                    loggedExpression = true;
                } else if (node.querySelector && node.querySelector('mjx-assistive-mml')) {
                    // Try to get content from assistive MathML
                    const assistiveMML = node.querySelector('mjx-assistive-mml');
                    if (assistiveMML && assistiveMML.textContent) {
                        console.log('[INPUT] Math expression from assistive MML: "' + 
                            assistiveMML.textContent.trim() + '"');
                        loggedExpression = true;
                    }
                }
            } catch(e) {
                // Ignore errors in accessing aria-label
            }
            
            console.log('[INFO] Translating CHTML format...');
        }
        
        // Process CHTML format
        const result = convertCHTMLToLatex(node);
        
        if (isTopLevel) {
            console.log('[INFO] CHTML to LaTeX conversion completed successfully');
            conversionInProgress = false;
            // Apply final parenthesis fix at the top level
            return fixParentheses(result); 
        }
        
        return result; // Return intermediate result for recursion
    }
    
    // Original SVG format handling
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
        
        console.log('[INFO] Translating SVG format...');
        
        // Add debug prints for SVG MathML structure
        console.log('[DEBUG] Processing SVG MathML structure');
        
        // Print the node structure for debugging
        try {
            // Check if the debug functions exist before calling them
            if (typeof debugPrintSVGElement === 'function') {
                debugPrintSVGElement(node, 0);
            } else {
                console.log('[DEBUG] debugPrintSVGElement function not found.');
            }
            
            // Find all data-mml-node elements and print their types
            if (typeof getAllMMLNodes === 'function') {
                const mmlNodes = getAllMMLNodes(node);
                console.log(`[DEBUG] Found ${mmlNodes.length} MML nodes in SVG structure`);
            } else {
                 console.log('[DEBUG] getAllMMLNodes function not found.');
            }
            
            // Print code points for Unicode characters
            const useElements = node.querySelectorAll ? node.querySelectorAll('use[data-c]') : [];
            if (useElements.length > 0) {
                console.log(`[DEBUG] Found ${useElements.length} Unicode code points:`);
                const codePoints = Array.from(useElements).map(el => {
                    const codePoint = el.getAttribute('data-c');
                    let char = '';
                    try {
                        char = String.fromCodePoint(parseInt(codePoint, 16)); 
                    } catch (e) {
                        char = '[invalid]';
                    }
                    return `U+${codePoint.toUpperCase()} (${char})`; 
                });
                console.log(`[DEBUG] Code points: ${codePoints.slice(0, 10).join(', ')}${codePoints.length > 10 ? '...' : ''}`);
            }
            
            // Print overall structure summary
            if (node.querySelector) {
                const summary = {
                    math: node.querySelectorAll('[data-mml-node="math"]').length,
                    mi: node.querySelectorAll('[data-mml-node="mi"]').length,
                    mo: node.querySelectorAll('[data-mml-node="mo"]').length,
                    mn: node.querySelectorAll('[data-mml-node="mn"]').length,
                    mfrac: node.querySelectorAll('[data-mml-node="mfrac"]').length,
                    msup: node.querySelectorAll('[data-mml-node="msup"]').length,
                    msub: node.querySelectorAll('[data-mml-node="msub"]').length,
                    mover: node.querySelectorAll('[data-mml-node="mover"]').length,
                    mrow: node.querySelectorAll('[data-mml-node="mrow"]').length,
                    msqrt: node.querySelectorAll('[data-mml-node="msqrt"]').length,
                    TeXAtom: node.querySelectorAll('[data-mml-node="TeXAtom"]').length
                };
                console.log('[DEBUG] SVG MathML structure summary:', summary);
            }
        } catch (e) {
            console.log('[DEBUG] Error while printing SVG structure:', e.message, e.stack);
        }
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
            result = processChildren(node);
            if (isTopLevel) {
                console.log('[INFO] MathJax to LaTeX conversion completed successfully');
                conversionInProgress = false;
                // Apply final parenthesis fix at the top level
                return fixParentheses(result); 
            }
            return result; // Return intermediate result for recursion
        
        case 'mrow':
            if (node.getAttribute && node.getAttribute('data-semantic-role') === "equality") {
                const children = Array.from(node.children || []);
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
                    
                    if (isTopLevel) {
                        console.log('[PROGRESS] Processed equation with left and right sides');
                    }
                    
                    if (isTopLevel) conversionInProgress = false;
                    return leftLatex + '=' + rightLatex;
                }
            }

            if (isImplicitFunction(node)) {
                const func = node.querySelector('[data-mml-node="mi"]');
                const arg = node.querySelector('[data-mml-node="mrow"]');
                
                if (func && arg) {
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
            const mi = getNodeContent(node);
            if (isStandardFunction(mi)) {
                return '\\' + mi;
            }
            
            if (node.parentNode && 
                (['cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'].some(fn => 
                fn[0] === mi.toLowerCase() && node.parentNode.textContent.startsWith(fn)))) {
                return mi;
            }
            
            return mi;
        
        case 'mn':
            const number = getNodeContent(node);
            return number;
        
        case 'mo':
            // Use getNodeContent to handle <use> elements correctly
            const opContent = getNodeContent(node); 
            
            // Handle vector arrow character (should be empty as it's handled by mover)
            if (opContent === '\u20D7') return ''; 
            // Handle overline character (should be empty as it's handled by mover)
            if (opContent === '\u0305') return ''; 

            // Add spacing around binary operators and handle specific symbols
            switch (opContent) {
                case '=': return ' = '; // Add space
                case '+': return ' + '; // Add space
                case '−': // Unicode Minus
                case '-': // Hyphen-Minus
                    return ' - '; // Add space
                case '×': // From data-c="D7" or text
                case '\\times': // From unicode mapping
                    return ' \\times '; // Add space
                case '÷': 
                case '\\div':
                    return ' \\div '; // Add space
                case '±': 
                case '\\pm':
                    return ' \\pm '; // Add space
                case '*': return ' * '; // Add space for asterisk multiplication
                // Handle fences - use simple parentheses for SVG for now
                case '(': return '('; 
                case ')': return ')';
                case '[': return '[';
                case ']': return ']';
                case '{': return '\\{'; // Need to escape in LaTeX
                case '}': return '\\}'; // Need to escape in LaTeX
                case '|': 
                    // Basic absolute value check (needs improvement for complex cases)
                    if (isStartOfAbsValue(node)) {
                        return '\\left| '; // Add space after opening
                    } else if (isEndOfAbsValue(node)) {
                        return ' \\right|'; // Add space before closing
                    }
                    return '|'; // Default bar
                case '\'': return '\'';
                case '′': return '\'';  // Unicode prime U+2032
                case '': return ''; // Ignore empty operators (invisible times etc.)
                // Add other operators that need spacing
                case '<': return ' < ';
                case '>': return ' > ';
                case '≤': 
                case '\\leq': return ' \\leq ';
                case '≥': 
                case '\\geq': return ' \\geq ';
                case '≠': 
                case '\\neq': return ' \\neq ';
                case '≈': 
                case '\\approx': return ' \\approx ';
                case '→': 
                case '\\rightarrow': return ' \\rightarrow ';
                 // Return other operators/symbols directly (spacing might depend on context)
                default: return opContent; 
            }
        
        case 'mtext':
            const text = getNodeContent(node);
            if (text === 'π') return '\\pi ';
            if (text === 'd') return 'd';
            return text;
        
        case 'msqrt':
            return processMsqrt(node);
        
        case 'mfrac':
            if (node.children.length >= 2) {
                const num = node.children[0];
                const den = node.children[1];
                const numLatex = convertMathMLToLatex(num);
                const denLatex = convertMathMLToLatex(den);
                
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
            if (node.children.length >= 2) {
                const base = node.children[0];
                const exp = node.children[1];
                
                let baseText;
                if (isParenthesizedExpression(base)) {
                    baseText = processParenthesizedExpression(base);
                } else {
                    baseText = convertMathMLToLatex(base);
                }
                
                const expText = convertMathMLToLatex(exp);
                
                const needsParens = isCompoundElement(base) && !isParenthesizedExpression(base);
                
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
            if (node.children.length >= 3) {
                const baseOp = node.children[0];
                const underScript = node.children[1];
                const overScript = node.children[2];
                
                const baseOpContent = getNodeContent(baseOp);
                const underLatex = convertMathMLToLatex(underScript);
                const overLatex = convertMathMLToLatex(overScript);
                
                if (baseOpContent === '∫') {
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

        case 'mover':
            if (node.children.length >= 2) {
                const base = node.children[0];
                const overscript = node.children[1];
                
                const overscriptContent = getNodeContent(overscript);
                const overscriptNode = overscript.querySelector('use[data-c="20D7"]'); 
                const overlineNode = overscript.querySelector('use[data-c="305"]'); 

                if (overscriptContent === '\u20D7' || overscriptNode) { 
                    const baseLatex = convertMathMLToLatex(base);
                    if (isTopLevel) {
                        console.log('[PROGRESS] Processed overrightarrow');
                    }
                    if (isTopLevel) conversionInProgress = false;
                    return '\\overrightarrow{' + baseLatex + '}';
                } else if (overscriptContent === '\u0305' || overlineNode || node.getAttribute('data-semantic-type') === 'overscore') { 
                    const baseLatex = convertMathMLToLatex(base);
                    if (isTopLevel) {
                        console.log('[PROGRESS] Processed overline');
                    }
                    if (isTopLevel) conversionInProgress = false;
                    return '\\overline{' + baseLatex + '}';
                }
                
                const baseLatex = convertMathMLToLatex(base);
                const overLatex = convertMathMLToLatex(overscript);
                if (isTopLevel) conversionInProgress = false;
                return baseLatex + (overLatex.trim() ? '^{' + overLatex + '}' : ''); 
            }
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;

        default:
            result = processChildren(node);
            if (isTopLevel) conversionInProgress = false;
            return result;
    }
}

/**
 * Recursively prints the structure of an SVG element for debugging.
 * @param {Element} element - The SVG element to print.
 * @param {number} indentLevel - The current indentation level.
 */
function debugPrintSVGElement(element, indentLevel) {
    if (!element || indentLevel > 10) return; // Limit recursion depth

    const indent = '  '.repeat(indentLevel);
    const tagName = element.tagName ? element.tagName.toLowerCase() : 'unknown';
    let attributes = '';
    if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            if (attr.name !== 'xlink:href' || tagName === 'use') {
                 attributes += ` ${attr.name}="${attr.value}"`;
            }
        }
    }

    let content = '';
    if (tagName === 'use') {
    } else if (element.textContent && element.children.length === 0) {
        content = ` | Content: "${element.textContent.trim()}"`;
    }

    console.log(`${indent}<${tagName}${attributes}>${content}`);

    if (element.childNodes) {
        element.childNodes.forEach(child => {
            if (child.nodeType === 1) {
                debugPrintSVGElement(child, indentLevel + 1);
            } else if (child.nodeType === 3 && child.textContent.trim()) {
            }
        });
    }
}

/**
 * Finds all elements with a 'data-mml-node' attribute within a given node.
 * @param {Element} node - The starting node to search within.
 * @returns {NodeList} - A NodeList containing all matching elements.
 */
function getAllMMLNodes(node) {
    if (node && typeof node.querySelectorAll === 'function') {
        return node.querySelectorAll('[data-mml-node]');
    }
    return [];
}

/**
 * Detects if the provided node is part of CHTML format MathJax
 * @param {Element} node - The node to check
 * @return {boolean} - True if CHTML format, false otherwise
 */
function isCHTMLFormat(node) {
    if (node.tagName && node.tagName.toLowerCase() === 'mjx-container' && 
        node.getAttribute && node.getAttribute('jax') === 'CHTML') {
        return true;
    }
    
    if (node.tagName && node.tagName.toLowerCase().startsWith('mjx-')) {
        if (node.closest && (node.closest('mjx-math') || node.closest('mjx-container[jax="CHTML"]'))) {
            return true;
        }
    }
    
    return false;
}

/**
 * Converts CHTML format MathJax to LaTeX
 * @param {Element} node - The CHTML node to convert
 * @return {string} - The LaTeX representation
 */
function convertCHTMLToLatex(node) {
    if (!node) return '';
    
    if (node.querySelector && node.querySelector('mjx-assistive-mml math')) {
        const mathmlNode = node.querySelector('mjx-assistive-mml math');
        return convertMathMLFromAssistiveMML(mathmlNode);
    }
    
    const tagName = node.tagName ? node.tagName.toLowerCase() : '';
    
    if (tagName === 'mjx-container') {
        const mathElem = node.querySelector('mjx-math');
        if (mathElem) {
            return convertCHTMLToLatex(mathElem);
        }
        return '';
    }
    
    if (tagName === 'mjx-math') {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    if (tagName === 'mjx-mi') {
        return handleCHTMLIdentifier(node);
    }
    
    if (tagName === 'mjx-mo') {
        return handleCHTMLOperator(node);
    }
    
    if (tagName === 'mjx-mn') {
        return handleCHTMLNumber(node);
    }
    
    if (tagName === 'mjx-mfrac' || tagName === 'mjx-frac') {
        return handleCHTMLFraction(node);
    }
    
    if (tagName === 'mjx-msqrt' || tagName === 'mjx-sqrt') {
        return handleCHTMLSqrt(node);
    }
    
    if (tagName === 'mjx-msup') {
        return handleCHTMLSuperscript(node);
    }
    
    if (tagName === 'mjx-msub') {
        return handleCHTMLSubscript(node);
    }
    
    if (tagName === 'mjx-texatom') {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    if (tagName === 'mjx-mrow' || tagName === 'mjx-box') {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    if (tagName.startsWith('mjx-')) {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    if (node.nodeType === 3) {
        return node.textContent.trim();
    }
    
    if (node.childNodes) {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    return '';
}

/**
 * Handles CHTML identifiers (variables)
 * @param {Element} node - The mjx-mi element
 * @return {string} - LaTeX representation
 */
function handleCHTMLIdentifier(node) {
    const textContent = getCHTMLContent(node);
    
    if (textContent === 'π') return '\\pi ';
    
    if (isStandardFunction(textContent)) {
        return '\\' + textContent;
    }
    
    return textContent;
}

/**
 * Handles CHTML operators
 * @param {Element} node - The mjx-mo element
 * @return {string} - LaTeX representation
 */
function handleCHTMLOperator(node) {
    const op = getCHTMLContent(node);
    
    switch (op) {
        case '=': return '=';
        case '+': return '+';
        case '-': 
        case '−': 
        case '−': return '-';
        case '×': return '\\times';
        case '÷': return '\\div';
        case '±': return '\\pm';
        case '|': return '|';
        case '(': return '('; // Let fixParentheses handle \left(
        case ')': return ')'; // Let fixParentheses handle \right)
        case '\'': return '\'';
        case '′': return '\'';  
        default: return op;
    }
}

/**
 * Handles CHTML numbers
 * @param {Element} node - The mjx-mn element
 * @return {string} - LaTeX representation
 */
function handleCHTMLNumber(node) {
    return getCHTMLContent(node);
}

/**
 * Handles CHTML fractions
 * @param {Element} node - The mjx-mfrac element
 * @return {string} - LaTeX representation
 */
function handleCHTMLFraction(node) {
    let numerator = '';
    let denominator = '';
    
    if (node.tagName.toLowerCase() === 'mjx-mfrac') {
        const fracNode = node.querySelector('mjx-frac');
        if (fracNode) {
            return handleCHTMLFraction(fracNode);
        }
    } else if (node.tagName.toLowerCase() === 'mjx-frac') {
        const numNode = node.querySelector('mjx-num');
        if (numNode) {
            for (const child of numNode.childNodes) {
                numerator += convertCHTMLToLatex(child);
            }
        }
        
        const denNode = node.querySelector('mjx-den');
        if (denNode) {
            for (const child of denNode.childNodes) {
                denominator += convertCHTMLToLatex(child);
            }
        }
        
        return '\\frac{' + numerator + '}{' + denominator + '}';
    }
    
    let result = '';
    for (const child of node.childNodes) {
        result += convertCHTMLToLatex(child);
    }
    return result;
}

/**
 * Handles CHTML square roots
 * @param {Element} node - The mjx-msqrt element
 * @return {string} - LaTeX representation
 */
function handleCHTMLSqrt(node) {
    if (node.tagName.toLowerCase() === 'mjx-msqrt') {
        let content = '';
        for (const child of node.childNodes) {
            if (child.tagName && child.tagName.toLowerCase() === 'mjx-sqrt') {
                continue;
            }
            content += convertCHTMLToLatex(child);
        }
        return '\\sqrt{' + content + '}';
    } else if (node.tagName.toLowerCase() === 'mjx-sqrt') {
        let content = '';
        for (const child of node.childNodes) {
            if (child.tagName && child.tagName.toLowerCase() !== 'mjx-surd') {
                content += convertCHTMLToLatex(child);
            }
        }
        
        const boxElem = node.querySelector('mjx-box');
        if (boxElem) {
            content = '';
            for (const child of boxElem.childNodes) {
                content += convertCHTMLToLatex(child);
            }
        }
        
        return '\\sqrt{' + content + '}';
    }
    
    let content = '';
    for (const child of node.childNodes) {
        if (!(child.querySelector && child.querySelector('mjx-c.mjx-c221A'))) {
            content += convertCHTMLToLatex(child);
        }
    }
    return content;
}

/**
 * Handles CHTML superscripts
 * @param {Element} node - The mjx-msup element
 * @return {string} - LaTeX representation
 */
function handleCHTMLSuperscript(node) {
    let base = '';
    let exponent = '';
    
    let baseFound = false;
    let scriptFound = false;
    
    for (const child of node.childNodes) {
        if (child.nodeType !== 1) continue;
        
        if (!baseFound) {
            base = convertCHTMLToLatex(child);
            baseFound = true;
        } else if (!scriptFound) {
            if (child.tagName && child.tagName.toLowerCase() === 'mjx-script') {
                for (const scriptChild of child.childNodes) {
                    exponent += convertCHTMLToLatex(scriptChild);
                }
                scriptFound = true;
            } else {
                exponent = convertCHTMLToLatex(child);
                scriptFound = true;
            }
        }
    }
    
    if (!exponent) {
        const scriptElem = node.querySelector('mjx-script');
        if (scriptElem) {
            for (const child of scriptElem.childNodes) {
                exponent += convertCHTMLToLatex(child);
            }
        }
    }
    
    if (exponent === '2') {
        return base + '^{2}';
    }
    
    return base + '^{' + exponent + '}';
}

/**
 * Handles CHTML subscripts
 * @param {Element} node - The mjx-msub element
 * @return {string} - LaTeX representation
 */
function handleCHTMLSubscript(node) {
    let base = '';
    let subscript = '';
    
    let baseFound = false;
    for (const child of node.childNodes) {
        if (!baseFound && child.nodeType === 1) {
            base = convertCHTMLToLatex(child);
            baseFound = true;
        } else if (baseFound && child.nodeType === 1) {
            if (child.tagName.toLowerCase() === 'mjx-script') {
                subscript = convertCHTMLToLatex(child);
            } else {
                subscript = convertCHTMLToLatex(child);
            }
            break;
        }
    }
    
    return base + '_{' + subscript + '}';
}

/**
 * Extract content from CHTML element
 * @param {Element} node - CHTML element 
 * @return {string} - Text content
 */
function getCHTMLContent(node) {
    const mjxCElems = node.querySelectorAll('mjx-c');
    if (mjxCElems.length > 0) {
        return Array.from(mjxCElems).map(elem => {
            const classAttr = elem.getAttribute('class');
            if (classAttr && classAttr.includes('mjx-c')) {
                const match = classAttr.match(/mjx-c([0-9A-F]+)/);
                if (match && match[1]) {
                    try {
                        const codePoint = parseInt(match[1], 16);
                        if (codePoint) {
                            return String.fromCodePoint(codePoint);
                        }
                    } catch (e) {
                        console.log('[WARNING] Error converting code point:', match[1]);
                    }
                }
            }
            
            return elem.textContent || '';
        }).join('');
    }
    
    return node.textContent.trim();
}

/**
 * Convert MathML from assistive MML structure to LaTeX
 * @param {Element} mathmlNode - The assistive MathML node
 * @return {string} - LaTeX representation
 */
function convertMathMLFromAssistiveMML(mathmlNode) {
    if (!mathmlNode) {
        console.log('[DEBUG] convertMathMLFromAssistiveMML: Encountered null node, returning empty string.');
        return '';
    }

    const nodeName = mathmlNode.nodeName.toLowerCase();
    const nodeContentPreview = mathmlNode.textContent ? mathmlNode.textContent.trim().substring(0, 30) + '...' : '[no text content]';
    console.log(`[DEBUG] > Entering convertMathMLFromAssistiveMML for <${nodeName}>: "${nodeContentPreview}"`);

    let latexResult = '';

    switch (nodeName) {
        case 'math':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            let mathContent = '';
            for (const child of mathmlNode.childNodes) {
                mathContent += convertMathMLFromAssistiveMML(child);
            }
            latexResult = mathContent;
            break;
            
        case 'mi':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            const identifier = mathmlNode.textContent.trim();
            const mathvariant = mathmlNode.getAttribute('mathvariant');
            console.log(`[DEBUG]     Identifier: "${identifier}", MathVariant: "${mathvariant}"`);

            if (identifier === 'π') latexResult = '\\pi ';
            else if (identifier === '∂') latexResult = '\\partial ';
            else if (isStandardFunction(identifier)) latexResult = '\\' + identifier + ' ';
            else if (mathvariant === 'bold') latexResult = '\\mathbf{' + identifier + '}';
            else if (mathvariant === 'normal') {
                 if (identifier === '∇') latexResult = '\\nabla ';
                 else latexResult = identifier;
            }
            else latexResult = identifier;
            console.log(`[DEBUG]     Result for <mi>: "${latexResult}"`);
            break;
            
        case 'mo':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            const op = mathmlNode.textContent.trim();
            const texClass = mathmlNode.getAttribute('data-mjx-texclass');
            console.log(`[DEBUG]     Operator: "${op}", TexClass: "${texClass}"`);
            
            switch (op) {
                case '=': latexResult = '='; break;
                case '+': latexResult = '+'; break;
                case '−': latexResult = '-'; break;
                case '-': latexResult = '-'; break;
                case '×': latexResult = '\\times '; break;
                case '÷': latexResult = '\\div '; break;
                case '±': latexResult = '\\pm '; break;
                case '|': latexResult = '|'; break; 
                case '(': 
                    // Return simple parenthesis, let fixParentheses handle \left( later
                    latexResult = '('; 
                    break;
                case ')': 
                    // Return simple parenthesis, let fixParentheses handle \right) later
                    latexResult = ')'; 
                    break;
                case '\u20D7': latexResult = ''; break;
                case '\u0305': latexResult = ''; break;
                case '': latexResult = ''; break;
                default: 
                    console.log(`[DEBUG]     Unhandled operator: "${op}"`);
                    latexResult = op;
            }
            console.log(`[DEBUG]     Result for <mo>: "${latexResult}"`);
            break;
            
        case 'mn':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            latexResult = mathmlNode.textContent.trim();
            console.log(`[DEBUG]     Result for <mn>: "${latexResult}"`);
            break;
            
        case 'mfrac':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            const children = Array.from(mathmlNode.children);
            if (children.length < 2) {
                 console.log('[DEBUG]     [WARNING] Fraction missing numerator or denominator');
                 let fracResult = '';
                 for (const child of mathmlNode.childNodes) {
                     fracResult += convertMathMLFromAssistiveMML(child);
                 }
                 latexResult = fracResult;
            } else {
                const numElement = children[0];
                const denElement = children[1];
                console.log('[DEBUG]     Processing numerator...');
                const numerator = convertMathMLFromAssistiveMML(numElement);
                console.log('[DEBUG]     Processing denominator...');
                const denominator = convertMathMLFromAssistiveMML(denElement);
                latexResult = '\\frac{' + numerator + '}{' + denominator + '}';
            }
            console.log(`[DEBUG]     Result for <mfrac>: "${latexResult}"`);
            break;
            
        case 'msqrt':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            let sqrtContent = '';
            console.log('[DEBUG]     Processing content inside sqrt...');
            for (const child of mathmlNode.childNodes) {
                sqrtContent += convertMathMLFromAssistiveMML(child);
            }
            latexResult = '\\sqrt{' + sqrtContent + '}';
            console.log(`[DEBUG]     Result for <msqrt>: "${latexResult}"`);
            break;
            
        case 'msup':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            const supChildren = Array.from(mathmlNode.children);
             if (supChildren.length < 2) {
                console.log('[DEBUG]     [WARNING] Superscript missing base or exponent');
                latexResult = mathmlNode.textContent.trim();
            } else {
                const baseElementSup = supChildren[0];
                const expElement = supChildren[1];
                console.log('[DEBUG]     Processing base...');
                const baseSup = convertMathMLFromAssistiveMML(baseElementSup);
                console.log('[DEBUG]     Processing exponent...');
                const exponent = convertMathMLFromAssistiveMML(expElement);
                latexResult = baseSup + '^{' + exponent + '}';
            }
            console.log(`[DEBUG]     Result for <msup>: "${latexResult}"`);
            break;
            
        case 'msub':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
             const subChildren = Array.from(mathmlNode.children);
             if (subChildren.length < 2) {
                console.log('[DEBUG]     [WARNING] Subscript missing base or subscript');
                latexResult = mathmlNode.textContent.trim();
            } else {
                const baseSubElement = subChildren[0];
                const subElement = subChildren[1];
                console.log('[DEBUG]     Processing base...');
                const baseSub = convertMathMLFromAssistiveMML(baseSubElement);
                console.log('[DEBUG]     Processing subscript...');
                const subscript = convertMathMLFromAssistiveMML(subElement);
                latexResult = baseSub + '_{' + subscript + '}';
            }
            console.log(`[DEBUG]     Result for <msub>: "${latexResult}"`);
            break;
            
        case 'mrow':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            let rowContent = '';
            console.log('[DEBUG]     Processing children inside mrow...');
            for (const child of mathmlNode.childNodes) {
                rowContent += convertMathMLFromAssistiveMML(child);
            }
            latexResult = rowContent;
            console.log(`[DEBUG]     Result for <mrow>: "${latexResult}"`);
            break;
            
        case 'mtext':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
            latexResult = mathmlNode.textContent.trim();
            console.log(`[DEBUG]     Result for <mtext>: "${latexResult}"`);
            break;
            
        case 'mover':
            console.log(`[DEBUG]   Processing <${nodeName}>`);
             const moverChildren = Array.from(mathmlNode.children);
             if (moverChildren.length >= 2) {
                const baseElementMover = moverChildren[0];
                const overElement = moverChildren[1];

                const overContent = overElement.textContent.trim();
                const isVector = overContent === '\u20D7';
                const isOverline = overContent === '\u0305' || mathmlNode.getAttribute('data-semantic-type') === 'overscore';
                console.log(`[DEBUG]     Over content: "${overContent}", isVector: ${isVector}, isOverline: ${isOverline}`);

                console.log('[DEBUG]     Processing base...');
                const baseMover = convertMathMLFromAssistiveMML(baseElementMover);

                if (isVector) {
                    latexResult = '\\overrightarrow{' + baseMover + '}';
                } else if (isOverline) {
                    latexResult = '\\overline{' + baseMover + '}';
                } else {
                    console.log('[DEBUG]     Processing other overscript...');
                    const over = convertMathMLFromAssistiveMML(overElement);
                    latexResult = baseMover + (over.trim() ? '^{' + over + '}' : ''); 
                }
            } else {
                console.log('[DEBUG]     [WARNING] Mover structure unexpected, processing children as fallback.');
                let moverFallbackResult = '';
                for (const child of mathmlNode.childNodes) {
                    moverFallbackResult += convertMathMLFromAssistiveMML(child);
                }
                latexResult = moverFallbackResult;
            }
            console.log(`[DEBUG]     Result for <mover>: "${latexResult}"`);
            break;

        case '#text':
            const textTrimmed = mathmlNode.textContent.trim();
            if (textTrimmed === '') {
                console.log(`[DEBUG]   Skipping whitespace #text node.`);
                latexResult = '';
            } else {
                console.log(`[DEBUG]   Processing #text node: "${textTrimmed}"`);
                latexResult = textTrimmed;
            }
            break;
            
        default:
            console.log(`[DEBUG]   Processing unhandled node type: <${nodeName}>`);
            let defaultContent = '';
            console.log('[DEBUG]     Processing children as fallback...');
            for (const child of mathmlNode.childNodes) {
                defaultContent += convertMathMLFromAssistiveMML(child);
            }
            latexResult = defaultContent;
            console.log(`[DEBUG]     Fallback result for <${nodeName}>: "${latexResult}"`);
    }

    console.log(`[DEBUG] < Exiting convertMathMLFromAssistiveMML for <${nodeName}>, returning: "${latexResult}"`);
    // Do not apply fixParentheses here, it's done at the top level
    return latexResult; 
}

/**
 * Process children nodes
 * @param {Element} node - The parent node
 * @return {string} - LaTeX representation of children
 */
function processChildren(node) {
    let result = '';
    let skipNext = false;
    
    if (node.getAttribute && node.getAttribute('data-semantic-role') === 'prefix function') {
        const funcNode = node.querySelector('[data-semantic-type="function"]');
        if (funcNode) {
            const funcName = funcNode.textContent.toLowerCase().trim();
            
            const argNode = Array.from(node.childNodes).find(child => 
                child.getAttribute && 
                child.getAttribute('data-semantic-type') !== 'function' &&
                child.getAttribute('data-semantic-type') !== 'punctuation');
            
            const arg = argNode ? convertMathMLToLatex(argNode) : 'x';
            
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
    
    if (node.textContent) {
        const fullText = node.textContent.trim().toLowerCase();
        
        for (const func of ['cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'log', 'ln']) {
            if (isFunctionNode(node, func)) {
                const arg = getArgumentAfterFunction(node, func);
                return '\\' + func + ' ' + arg;
            }
        }
    }
    
    let possibleFunction = '';
    
    for (let i = 0; i < node.childNodes.length; i++) {
        if (skipNext) {
            skipNext = false;
            continue;
        }
        
        const child = node.childNodes[i];
        
        if (child.nodeType === 1 && 
            child.getAttribute && 
            child.getAttribute('data-mml-node') === 'mi') {
            
            const currentChar = getNodeContent(child).toLowerCase();
            
            const functionNames = ['cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'];
            const possibleFunctions = functionNames.filter(fn => fn.startsWith(currentChar));
            
            if (possibleFunctions.length > 0) {
                const functionResult = tryBuildFunctionName(node, i, functionNames);
                
                if (functionResult.isFunction) {
                    result += functionResult.latex;
                    i += functionResult.skipCount;
                    continue;
                }
            }
        }
        
        if (i > 0 && 
            node.childNodes[i-1].getAttribute && 
            node.childNodes[i-1].getAttribute('data-mml-node') === 'mi' &&
            child.getAttribute && 
            child.getAttribute('data-mml-node') === 'mo' && 
            getNodeContent(child) === '′') {
            result += "'";
            continue;
        } 
        
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

/**
 * Process square root nodes
 * @param {Element} node - The msqrt node (<g data-mml-node="msqrt">)
 * @return {string} - LaTeX representation
 */
function processMsqrt(node) {
    let radicandLatex = '';

    // Find the element representing the content (radicand).
    // This is often an <mrow> or the first element that's not purely graphical.
    let contentNode = null;
    if (node.children) {
        for (const child of node.children) {
            // Look for common content containers first
            if (child.getAttribute && 
                ['mrow', 'mi', 'mn', 'mfrac', 'msup', 'msub', 'mover', 'munder', 'munderover', 'mstyle'].includes(child.getAttribute('data-mml-node'))) {
                contentNode = child;
                break;
            }
            // Fallback: Check if it's a 'g' element likely containing content
            // Avoid 'g' elements that only contain 'use', 'rect', 'path', 'svg' used for drawing
            if (child.tagName.toLowerCase() === 'g' && 
                !child.querySelector('use[data-c="221A"], use[data-c="E000"], use[data-c="E001"], use[data-c="23B7"]') &&
                !child.querySelector('rect, path, svg')) {
                 // Check if this 'g' itself has a meaningful data-mml-node
                 if (child.getAttribute('data-mml-node') && child.getAttribute('data-mml-node') !== 'msqrt') {
                     contentNode = child;
                     break;
                 }
                 // If it's just a grouping 'g', look inside it
                 const innerContent = child.querySelector('[data-mml-node]');
                 if (innerContent && innerContent.getAttribute('data-mml-node') !== 'msqrt') {
                     contentNode = child; // Process the whole group if it contains content
                     break;
                 }
            }
        }
    }

    // If a content node was found, convert it
    if (contentNode) {
        radicandLatex = convertMathMLToLatex(contentNode);
    } else {
        // If no specific content node found (e.g., simple sqrt(x)), try processing children cautiously
        // This is less reliable and might still pick up symbol parts if structure is unexpected
        console.log('[DEBUG] msqrt: No specific content node found, attempting fallback processing.');
        let tempRadicand = '';
        if (node.children) {
            for (const child of node.children) {
                 // Skip known graphical elements explicitly
                 if (child.tagName.toLowerCase() === 'rect' || child.tagName.toLowerCase() === 'svg') continue;
                 if (child.querySelector('use[data-c="221A"], use[data-c="E000"], use[data-c="E001"], use[data-c="23B7"]')) continue;
                 
                 tempRadicand += convertMathMLToLatex(child);
            }
        }
        radicandLatex = tempRadicand;
    }

    // Clean up any stray symbol parts that might have slipped through (less likely now)
    radicandLatex = radicandLatex.replace(/[⎷]/g, '').trim(); // Remove the specific unwanted characters

    if (!conversionInProgress) {
        console.log('[PROGRESS] Processed square root');
    }

    return '\\sqrt{' + radicandLatex + '}';
}

/**
 * Check if a node is an invisible operator
 * @param {Element} node - The node to check
 * @return {boolean} - True if invisible operator, false otherwise
 */
function isInvisibleOperator(node) {
    if (!node) return false;
    
    const useElem = node.querySelector('use');
    if (useElem) {
        const dataC = useElem.getAttribute('data-c');
        return dataC === '2061' || dataC === '2062';
    }
    
    return false;
}

/**
 * Check if a node is a function node
 * @param {Element} node - The node to check
 * @param {string} functionName - The function name to check
 * @return {boolean} - True if function node, false otherwise
 */
function isFunctionNode(node, functionName) {
    if (!node || !node.textContent) return false;
    
    if (node.textContent.toLowerCase().includes(functionName)) {
        return true;
    }
    
    if (node.getAttribute && node.getAttribute('data-semantic-type') === "function") {
        return true;
    }
    
    if (node.getAttribute && node.getAttribute('data-semantic-role') === "prefix function") {
        return true;
    }
    
    return false;
}

/**
 * Get the argument after a function
 * @param {Element} node - The node to check
 * @param {string} functionName - The function name
 * @return {string} - The argument
 */
function getArgumentAfterFunction(node, functionName) {
    if (!node || !node.textContent) return 'x';
    
    const text = node.textContent.toLowerCase();
    const startIndex = text.indexOf(functionName) + functionName.length;
    const remaining = text.substring(startIndex).trim();
    
    if (remaining === 'x') return 'x';
    
    const match = remaining.match(/([a-z]|\([^)]*\))/i);
    if (match) return match[0];
    
    return 'x';
}

/**
 * Get content from a node, handling special cases
 * @param {Element} node - The node to extract content from
 * @return {string} - Text content or special handling result
 */
function getNodeContent(node) {
    if (node.textContent && node.textContent.includes('\u20D7')) {
        const baseChar = node.textContent.replace('\u20D7', '');
        if (baseChar) {
            return `\\overrightarrow{${baseChar}}`;
        }
        return '\\overrightarrow{}';
    }
    
    if (node.getAttribute && node.getAttribute('data-semantic-type') === 'function') {
        const nodeText = node.textContent.trim().toLowerCase();
        if (nodeText.includes('cos') || nodeText === 'cos') return '\\cos';
        if (nodeText.includes('sin') || nodeText === 'sin') return '\\sin';
        if (nodeText.includes('tan') || nodeText === 'tan') return '\\tan';
        if (nodeText.includes('cot') || nodeText === 'cot') return '\\cot';
        if (nodeText.includes('sec') || nodeText === 'sec') return '\\sec';
        if (nodeText.includes('csc') || nodeText === 'csc') return '\\csc';
        if (nodeText.includes('log') || nodeText === 'log') return '\\log';
        if (nodeText.includes('ln') || nodeText === 'ln') return '\\ln';
    }
    
    if (node.nodeName.toLowerCase() === 'g' && node.childNodes.length > 1) {
        const useNodes = Array.from(node.querySelectorAll('use[data-c]'));
        
        if (useNodes.length > 1) {
            const fullText = extractAllCharacters(useNodes);
            
            if (/^\d+$/.test(fullText)) {
                return fullText;
            }
            
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
    
    if (node.textContent) {
        const content = node.textContent.trim();
        if (content === 'π') return '\\pi ';
        if (content === '′') return '\'';
        if (content === '\u20D7') return '\u20D7';
        if (content === '\u0305') return '\u0305';
        
        if (isStandardFunction(content)) {
            return '\\' + content;
        }
        
        return content;
    }
    
    const textElem = node.querySelector('text');
    if (textElem) {
        const content = textElem.textContent.trim();
        if (content === 'π') return '\\pi ';
        if (content === 'd') return 'd';
        if (content === '′') return '\'';
        if (content === '\u20D7') return '\u20D7';
        if (content === '\u0305') return '\u0305';
        return content;
    }
    
    const useElem = node.querySelector('use');
    if (useElem) {
        const dataC = useElem.getAttribute('data-c');
        
        if (isFunctionNameStart(node)) {
            return getFunctionNameFromSequence(node);
        }
        
        if (dataC === '2061' || dataC === '2062') {
            return '';
        }
        
        if (dataC === '20D7') {
            return '\u20D7';
        }
        if (dataC === '305') {
            return '\u0305';
        }
        
        return getUnicodeMapping(dataC);
    }
    
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
 * Extract characters from useNodes
 * @param {NodeList} useNodes - List of USE elements to extract from
 * @return {string} - Extracted characters
 */
function extractAllCharacters(useNodes) {
    if (!useNodes || useNodes.length === 0) return '';
    
    const charData = useNodes.map(useNode => {
        const codePoint = useNode.getAttribute('data-c');
        const char = String.fromCharCode(parseInt(codePoint, 16));
        
        let x = 0;
        try {
            let element = useNode;
            while (element && !element.getAttribute('x')) {
                element = element.parentElement;
            }
            if (element && element.getAttribute('x')) {
                x = parseFloat(element.getAttribute('x'));
            }
        } catch (e) {
            console.log('[WARNING] Error getting element position');
        }
        
        return { char, x, codePoint };
    });
    
    charData.sort((a, b) => a.x - b.x);
    
    return charData.map(c => c.char).join('');
}

/**
 * Get Unicode mapping for a code point
 * @param {string} codePoint - The Unicode code point (hex string)
 * @return {string} - Mapped LaTeX command or the original character
 */
function getUnicodeMapping(codePoint) {
    const formattedCodePoint = "U+" + codePoint.toUpperCase().padStart(4, '0');
    
    // Check if a specific LaTeX mapping exists
    if (typeof unicode_to_tex !== 'undefined' && unicode_to_tex[formattedCodePoint]) {
        return unicode_to_tex[formattedCodePoint];
    }
    
    // Fallback: Try to return the original character
    try {
        const codePointInt = parseInt(codePoint, 16);
        if (!isNaN(codePointInt)) {
            const char = String.fromCodePoint(codePointInt);
            // Add a space after the character for better spacing in LaTeX, unless it's a combining character
            // Basic check for combining characters (range U+0300–U+036F, U+20D0–U+20FF)
            if ((codePointInt >= 0x0300 && codePointInt <= 0x036F) || 
                (codePointInt >= 0x20D0 && codePointInt <= 0x20FF)) {
                return char; 
            }
            return char + ' '; 
        }
    } catch (e) {
        console.log(`[WARNING] Error converting code point ${codePoint} to character:`, e.message);
    }
    
    // If conversion fails or no mapping, log a warning and return a placeholder
    console.log(`[WARNING] No mapping found for Unicode character ${formattedCodePoint}, and could not convert to character.`);
    return `[${formattedCodePoint}]`; // Keep placeholder as last resort
}

/**
 * Check if node is the start of a function name
 * @param {Element} node - The node to check
 * @return {boolean} - True if function name start, false otherwise
 */
function isFunctionNameStart(node) {
    const parent = node.parentNode;
    if (!parent) return false;
    
    const potentialFunction = getTextContent(parent);
    return isStandardFunction(potentialFunction);
}

/**
 * Get function name from a sequence
 * @param {Element} startNode - The starting node
 * @return {string} - Function name or empty string
 */
function getFunctionNameFromSequence(startNode) {
    const parent = startNode.parentNode;
    if (!parent) return '';
    
    const textContent = getTextContent(parent);
    if (isStandardFunction(textContent)) {
        return '\\' + textContent;
    }
    
    return '';
}

/**
 * Get text content from a node
 * @param {Element} node - The node
 * @return {string} - Text content
 */
function getTextContent(node) {
    if (!node || !node.textContent) return '';
    return node.textContent.trim();
}

/**
 * Check if node is a parenthesized expression
 * @param {Element} node - The node to check
 * @return {boolean} - True if parenthesized, false otherwise
 */
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

/**
 * Process a parenthesized expression
 * @param {Element} node - The node to process
 * @return {string} - LaTeX representation
 */
function processParenthesizedExpression(node) {
    const children = Array.from(node.children || []);
    const innerContent = processInnerContent(children.slice(1, -1));
    // Return simple parentheses here, fixParentheses will handle \left/\right
    return '(' + innerContent + ')'; 
}

/**
 * Process inner content of nodes
 * @param {Array} children - Array of child nodes
 * @return {string} - Combined LaTeX representation
 */
function processInnerContent(children) {
    return children.map(child => convertMathMLToLatex(child)).join('');
}

/**
 * Check if node is a compound element
 * @param {Element} node - The node to check
 * @return {boolean} - True if compound, false otherwise
 */
function isCompoundElement(node) {
    if (!node) return false;
    
    if (node.getAttribute && node.getAttribute('data-mml-node') === 'mrow') {
        const children = Array.from(node.children);
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

/**
 * Check if node is an implicit function
 * @param {Element} node - The node to check
 * @return {boolean} - True if implicit function, false otherwise
 */
function isImplicitFunction(node) {
    if (!node || node.getAttribute('data-mml-node') !== 'mrow') return false;
    
    const children = Array.from(node.children || []);
    if (children.length < 2) return false;
    
    const firstChild = children[0];
    const isFunctionName = firstChild && 
        firstChild.getAttribute('data-mml-node') === 'mi';
    
    if (!isFunctionName) return false;
    
    for (let i = 1; i < children.length; i++) {
        const child = children[i];
        
        if (child.getAttribute && child.getAttribute('data-mml-node') === 'mo' && 
            ((child.querySelector && child.querySelector('use[data-c="2061"]')) || 
             getNodeContent(child) === '')) {
            return true;
        }
        
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

/**
 * Process argument parentheses
 * @param {Element} node - The node to process
 * @return {string} - LaTeX representation
 */
function processArgumentParentheses(node) {
    if (!node) return '';
    
    const children = Array.from(node.children || []);
    
    const firstChild = children.length > 0 ? children[0] : null;
    const lastChild = children.length > 0 ? children[children.length - 1] : null;
    
    // Check if the MML already had explicit parentheses
    const hasOpeningParen = firstChild && 
        firstChild.getAttribute('data-mml-node') === 'mo' && 
        getNodeContent(firstChild) === '(';
        
    const hasClosingParen = lastChild && 
        lastChild.getAttribute('data-mml-node') === 'mo' && 
        getNodeContent(lastChild) === ')';
    
    if (hasOpeningParen && hasClosingParen) {
        const innerContent = processInnerContent(children.slice(1, -1));
        // Return simple parentheses here
        return '(' + innerContent + ')'; 
    } else {
        // If parentheses were implicit, add simple ones
        return '(' + convertMathMLToLatex(node) + ')'; 
    }
}

/**
 * Check if node is the start of absolute value
 * @param {Element} node - The node to check
 * @return {boolean} - True if start of abs value, false otherwise
 */
function isStartOfAbsValue(node) {
    const op = getNodeContent(node);
    if (op !== '|') return false;
    
    const parent = findParentWithType(node, 'mrow');
    if (!parent) return false;
    
    const verticalBars = Array.from(parent.querySelectorAll('[data-mml-node="mo"]'))
        .filter(n => getNodeContent(n) === '|');
    
    if (verticalBars.length !== 2) return false;
    return verticalBars[0] === node;
}

/**
 * Check if node is the end of absolute value
 * @param {Element} node - The node to check
 * @return {boolean} - True if end of abs value, false otherwise
 */
function isEndOfAbsValue(node) {
    const op = getNodeContent(node);
    if (op !== '|') return false;
    
    const parent = findParentWithType(node, 'mrow');
    if (!parent) return false;
    
    const verticalBars = Array.from(parent.querySelectorAll('[data-mml-node="mo"]'))
        .filter(n => getNodeContent(n) === '|');
    
    if (verticalBars.length !== 2) return false;
    return verticalBars[1] === node;
}

/**
 * Find parent with specific type
 * @param {Element} node - The node to check
 * @param {string} type - The type to find
 * @return {Element|null} - Parent node or null
 */
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

/**
 * Try to build a function name from consecutive nodes
 * @param {Element} node - The parent node
 * @param {number} startIndex - Starting index in childNodes
 * @param {Array} functionNames - Array of function names to check
 * @return {Object} - Result with isFunction flag, LaTeX string, and skip count
 */
function tryBuildFunctionName(node, startIndex, functionNames) {
    let result = { isFunction: false, latex: '', skipCount: 0 };
    
    if (!node || !node.childNodes || startIndex >= node.childNodes.length) {
        return result;
    }
    
    let potentialName = '';
    let nodeCount = 0;
    
    for (let i = 0; i < 4 && (startIndex + i) < node.childNodes.length; i++) {
        const childNode = node.childNodes[startIndex + i];
        
        if (childNode.nodeType !== 1 || !childNode.textContent) {
            continue;
        }
        
        let content = '';
        if (childNode.getAttribute && childNode.getAttribute('data-mml-node') === 'mi') {
            content = getNodeContent(childNode).toLowerCase();
        } else if (childNode.textContent) {
            content = childNode.textContent.trim().toLowerCase();
        }
        
        if (content) {
            potentialName += content;
            nodeCount = i + 1;
            
            if (functionNames.includes(potentialName)) {
                return {
                    isFunction: true,
                    latex: '\\' + potentialName + ' ',
                    skipCount: nodeCount - 1
                };
            }
            
            const stillPossible = functionNames.some(fn => fn.startsWith(potentialName));
            if (!stillPossible) {
                break;
            }
        }
    }
    
    return result;
}

/**
 * Check if the name is a standard mathematical function
 * @param {string} name - The name to check
 * @return {boolean} - True if standard function, false otherwise
 */
function isStandardFunction(name) {
    if (!name) return false;
    
    const standardFunctions = [
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc',
        'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
        'log', 'ln', 'exp', 'lim', 'max', 'min',
        'sup', 'inf'
    ];
    
    return standardFunctions.includes(name.toLowerCase());
}

/**
 * Replaces standalone parentheses with \left( and \right) in the final LaTeX string.
 * Avoids replacing already existing \left( or \right).
 * @param {string} latexString - The LaTeX string to process.
 * @return {string} - The processed LaTeX string.
 */
function fixParentheses(latexString) {
    if (!latexString) return '';
    
    // Use a temporary placeholder for existing \left( and \right) to avoid double replacement
    const leftPlaceholder = "@@LEFT_PAREN@@";
    const rightPlaceholder = "@@RIGHT_PAREN@@";
    
    // Replace existing \left( and \right) with placeholders
    let processedString = latexString.replace(/\\left\(/g, leftPlaceholder);
    processedString = processedString.replace(/\\right\)/g, rightPlaceholder);
    
    // Replace standalone ( and )
    processedString = processedString.replace(/\(/g, '\\left(');
    processedString = processedString.replace(/\)/g, '\\right)');
    
    // Restore the original \left( and \right) from placeholders
    processedString = processedString.replace(new RegExp(leftPlaceholder, 'g'), '\\left(');
    processedString = processedString.replace(new RegExp(rightPlaceholder, 'g'), '\\right)');
    
    return processedString;
}

/**
 * Define unicode_to_tex fallback in case it's not defined
 */
if (typeof unicode_to_tex === 'undefined') {
    console.log('[INFO] Creating fallback unicode_to_tex mapping');
    window.unicode_to_tex = {};
}
