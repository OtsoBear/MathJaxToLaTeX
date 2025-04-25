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
        }
        
        return result;
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

/**
 * Detects if the provided node is part of CHTML format MathJax
 * @param {Element} node - The node to check
 * @return {boolean} - True if CHTML format, false otherwise
 */
function isCHTMLFormat(node) {
    // Check if this is a mjx-container with CHTML jax
    if (node.tagName && node.tagName.toLowerCase() === 'mjx-container' && 
        node.getAttribute && node.getAttribute('jax') === 'CHTML') {
        return true;
    }
    
    // Check if this is a child element of CHTML structure
    if (node.tagName && node.tagName.toLowerCase().startsWith('mjx-')) {
        // Check if we have mjx-math parent or container somewhere
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
    
    // If we have the assistive MathML, we can use it directly for better accuracy
    if (node.querySelector && node.querySelector('mjx-assistive-mml math')) {
        const mathmlNode = node.querySelector('mjx-assistive-mml math');
        return convertMathMLFromAssistiveMML(mathmlNode);
    }
    
    // Handle different CHTML element types
    const tagName = node.tagName ? node.tagName.toLowerCase() : '';
    
    // Handle main container
    if (tagName === 'mjx-container') {
        // Look for the math element
        const mathElem = node.querySelector('mjx-math');
        if (mathElem) {
            return convertCHTMLToLatex(mathElem);
        }
        return '';
    }
    
    // Handle math element (root)
    if (tagName === 'mjx-math') {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    // Handle variables (mi)
    if (tagName === 'mjx-mi') {
        return handleCHTMLIdentifier(node);
    }
    
    // Handle operators (mo)
    if (tagName === 'mjx-mo') {
        return handleCHTMLOperator(node);
    }
    
    // Handle numbers (mn)
    if (tagName === 'mjx-mn') {
        return handleCHTMLNumber(node);
    }
    
    // Handle fractions
    if (tagName === 'mjx-mfrac' || tagName === 'mjx-frac') {
        return handleCHTMLFraction(node);
    }
    
    // Handle square roots
    if (tagName === 'mjx-msqrt' || tagName === 'mjx-sqrt') {
        return handleCHTMLSqrt(node);
    }
    
    // Handle superscripts
    if (tagName === 'mjx-msup') {
        return handleCHTMLSuperscript(node);
    }
    
    // Handle subscripts
    if (tagName === 'mjx-msub') {
        return handleCHTMLSubscript(node);
    }
    
    // Handle texatom (special wrapping element)
    if (tagName === 'mjx-texatom') {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    // Handle specific containers like mjx-mrow, mjx-box
    if (tagName === 'mjx-mrow' || tagName === 'mjx-box') {
        // Check for specific mrow patterns like parenthesized expressions
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    // Handle general containers starting with mjx-
    if (tagName.startsWith('mjx-')) {
        let result = '';
        for (const child of node.childNodes) {
            result += convertCHTMLToLatex(child);
        }
        return result;
    }
    
    // For text nodes, return the text content if any
    if (node.nodeType === 3) {
        return node.textContent.trim();
    }
    
    // For any other elements, process children
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
    // Extract text content from mjx-c children or the node itself
    const textContent = getCHTMLContent(node);
    
    // Special cases for identifiers
    if (textContent === 'π') return '\\pi';
    
    // Handle common math functions
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
    
    // Map operators to LaTeX
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
        case '(': return '\\left(';
        case ')': return '\\right)';
        case '\'': return '\'';
        case '′': return '\'';  // Unicode prime
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
    // For mjx-mfrac, we need to find numerator and denominator
    let numerator = '';
    let denominator = '';
    
    // Check if we're in the main mjx-mfrac container
    if (node.tagName.toLowerCase() === 'mjx-mfrac') {
        // Find the mjx-frac inside
        const fracNode = node.querySelector('mjx-frac');
        if (fracNode) {
            return handleCHTMLFraction(fracNode);
        }
    } else if (node.tagName.toLowerCase() === 'mjx-frac') {
        // Get the numerator node
        const numNode = node.querySelector('mjx-num');
        if (numNode) {
            // Process the numerator - handle each child to avoid missed elements
            for (const child of numNode.childNodes) {
                numerator += convertCHTMLToLatex(child);
            }
        }
        
        // Get the denominator node
        const denNode = node.querySelector('mjx-den');
        if (denNode) {
            // Process the denominator - handle each child to avoid missed elements
            for (const child of denNode.childNodes) {
                denominator += convertCHTMLToLatex(child);
            }
        }
        
        // Ensure we're properly formatting the fraction
        return '\\frac{' + numerator + '}{' + denominator + '}';
    }
    
    // Fallback to processing children
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
    // If this is the mjx-sqrt container
    if (node.tagName.toLowerCase() === 'mjx-msqrt') {
        // Extract all content except the sqrt symbol
        let content = '';
        for (const child of node.childNodes) {
            // Skip the actual sqrt symbol node
            if (child.tagName && child.tagName.toLowerCase() === 'mjx-sqrt') {
                continue;
            }
            content += convertCHTMLToLatex(child);
        }
        return '\\sqrt{' + content + '}';
    } else if (node.tagName.toLowerCase() === 'mjx-sqrt') {
        // Find the content inside the sqrt but outside the surd
        let content = '';
        for (const child of node.childNodes) {
            if (child.tagName && child.tagName.toLowerCase() !== 'mjx-surd') {
                content += convertCHTMLToLatex(child);
            }
        }
        
        // If there's a mjx-box, process its contents directly
        const boxElem = node.querySelector('mjx-box');
        if (boxElem) {
            content = '';
            for (const child of boxElem.childNodes) {
                content += convertCHTMLToLatex(child);
            }
        }
        
        return '\\sqrt{' + content + '}';
    }
    
    // For any level below, just process children
    let content = '';
    for (const child of node.childNodes) {
        // Skip the actual sqrt symbol
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
    // Find base and exponent
    let base = '';
    let exponent = '';
    
    // The first child is normally the base
    let baseFound = false;
    let scriptFound = false;
    
    for (const child of node.childNodes) {
        if (child.nodeType !== 1) continue; // Skip non-element nodes
        
        if (!baseFound) {
            base = convertCHTMLToLatex(child);
            baseFound = true;
        } else if (!scriptFound) {
            // Handle script element or direct exponent
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
    
    // Check for empty exponent
    if (!exponent) {
        // Look for script element and its contents
        const scriptElem = node.querySelector('mjx-script');
        if (scriptElem) {
            for (const child of scriptElem.childNodes) {
                exponent += convertCHTMLToLatex(child);
            }
        }
    }
    
    // Special case for squared
    if (exponent === '2') {
        return base + '^{2}';
    }
    
    // Make sure we always have proper curly braces for the exponent
    return base + '^{' + exponent + '}';
}

/**
 * Handles CHTML subscripts
 * @param {Element} node - The mjx-msub element
 * @return {string} - LaTeX representation
 */
function handleCHTMLSubscript(node) {
    // Find base and subscript
    let base = '';
    let subscript = '';
    
    // The first child is the base
    let baseFound = false;
    for (const child of node.childNodes) {
        if (!baseFound && child.nodeType === 1) {
            base = convertCHTMLToLatex(child);
            baseFound = true;
        } else if (baseFound && child.nodeType === 1) {
            // Check if this is the script element
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
    // Check for direct mjx-c elements
    const mjxCElems = node.querySelectorAll('mjx-c');
    if (mjxCElems.length > 0) {
        // Combine the content from all mjx-c elements
        return Array.from(mjxCElems).map(elem => {
            // Try to get the content from the class
            const classAttr = elem.getAttribute('class');
            if (classAttr && classAttr.includes('mjx-c')) {
                // Extract the Unicode code point from class like "mjx-c1D465 TEX-I"
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
            
            // Fallback to text content
            return elem.textContent || '';
        }).join('');
    }
    
    // Fallback to regular text content
    return node.textContent.trim();
}

/**
 * Convert MathML from assistive MML structure to LaTeX
 * @param {Element} mathmlNode - The assistive MathML node
 * @return {string} - LaTeX representation
 */
function convertMathMLFromAssistiveMML(mathmlNode) {
    if (!mathmlNode) return '';
    
    // Add debug logging
    console.log('[DEBUG] Processing MathML node:', mathmlNode.nodeName, 
        mathmlNode.textContent ? mathmlNode.textContent.substring(0, 20) + '...' : '');
    
    // Check node type
    const nodeName = mathmlNode.nodeName.toLowerCase();
    
    switch (nodeName) {
        case 'math':
            // Process all children
            let result = '';
            for (const child of mathmlNode.childNodes) {
                result += convertMathMLFromAssistiveMML(child);
            }
            return result;
            
        case 'mi': // Identifier
            const identifier = mathmlNode.textContent.trim();
            if (identifier === 'π') return '\\pi';
            if (isStandardFunction(identifier)) return '\\' + identifier;
            return identifier;
            
        case 'mo': // Operator
            const op = mathmlNode.textContent.trim();
            switch (op) {
                case '=': return '=';
                case '+': return '+';
                case '−': case '-': return '-';
                case '×': return '\\times';
                case '÷': return '\\div';
                case '±': return '\\pm';
                case '|': return '|';
                case '(': return '\\left(';
                case ')': return '\\right)';
                default: return op;
            }
            
        case 'mn': // Number
            return mathmlNode.textContent.trim();
            
        case 'mfrac': // Fraction
            console.log('[DEBUG] Processing fraction with XML:', mathmlNode.outerHTML);
            
            // Check that we have numerator and denominator elements
            const numElement = mathmlNode.firstElementChild;
            const denElement = mathmlNode.lastElementChild;
            
            if (!numElement || !denElement) {
                console.log('[WARNING] Fraction missing numerator or denominator');
                return mathmlNode.textContent.trim();
            }
            
            // Process numerator and denominator recursively
            const numerator = convertMathMLFromAssistiveMML(numElement);
            const denominator = convertMathMLFromAssistiveMML(denElement);
            
            console.log(`[DEBUG] Fraction: num=${numerator}, den=${denominator}`);
            
            // Return proper LaTeX fraction
            return '\\frac{' + numerator + '}{' + denominator + '}';
            
        case 'msqrt': // Square root
            console.log('[DEBUG] Processing square root with XML:', mathmlNode.outerHTML);
            let sqrtContent = '';
            
            // Process all children inside the root
            for (const child of mathmlNode.childNodes) {
                sqrtContent += convertMathMLFromAssistiveMML(child);
            }
            
            console.log(`[DEBUG] Square root content: ${sqrtContent}`);
            return '\\sqrt{' + sqrtContent + '}';
            
        case 'msup': // Superscript
            console.log('[DEBUG] Processing superscript with XML:', mathmlNode.outerHTML);
            
            // Get base and exponent elements
            const baseElement = mathmlNode.firstElementChild;
            const expElement = mathmlNode.lastElementChild;
            
            if (!baseElement || !expElement) {
                console.log('[WARNING] Superscript missing base or exponent');
                return mathmlNode.textContent.trim();
            }
            
            // Process base and exponent recursively
            const base = convertMathMLFromAssistiveMML(baseElement);
            const exponent = convertMathMLFromAssistiveMML(expElement);
            
            console.log(`[DEBUG] Superscript: base=${base}, exp=${exponent}`);
            
            // Return proper LaTeX superscript
            return base + '^{' + exponent + '}';
            
        case 'msub': // Subscript
            console.log('[DEBUG] Processing subscript with XML:', mathmlNode.outerHTML);
            
            // Get base and subscript elements
            const baseSubElement = mathmlNode.firstElementChild;
            const subElement = mathmlNode.lastElementChild;
            
            if (!baseSubElement || !subElement) {
                console.log('[WARNING] Subscript missing base or subscript');
                return mathmlNode.textContent.trim();
            }
            
            // Process base and subscript recursively
            const baseSub = convertMathMLFromAssistiveMML(baseSubElement);
            const subscript = convertMathMLFromAssistiveMML(subElement);
            
            // Return proper LaTeX subscript
            return baseSub + '_{' + subscript + '}';
            
        case 'mrow': // Row of math
            console.log('[DEBUG] Processing mrow with XML:', mathmlNode.outerHTML);
            let rowResult = '';
            for (const child of mathmlNode.childNodes) {
                rowResult += convertMathMLFromAssistiveMML(child);
            }
            return rowResult;
            
        case 'mtext': // Text
            return mathmlNode.textContent.trim();
            
        case '#text': // Text node
            return mathmlNode.textContent.trim();
            
        default:
            console.log(`[DEBUG] Processing unhandled node type: ${nodeName}`);
            // For other elements, process children
            let defaultResult = '';
            for (const child of mathmlNode.childNodes) {
                defaultResult += convertMathMLFromAssistiveMML(child);
            }
            return defaultResult;
    }
}

/**
 * Process children nodes
 * @param {Element} node - The parent node
 * @return {string} - LaTeX representation of children
 */
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
            const functionNames = ['cos', 'sin', 'tan', 'cot', 'sec', 'csc', 'log', 'ln'];
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

/**
 * Process square root nodes
 * @param {Element} node - The msqrt node
 * @return {string} - LaTeX representation
 */
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

/**
 * Check if a node is an invisible operator
 * @param {Element} node - The node to check
 * @return {boolean} - True if invisible operator, false otherwise
 */
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

/**
 * Check if a node is a function node
 * @param {Element} node - The node to check
 * @param {string} functionName - The function name to check
 * @return {boolean} - True if function node, false otherwise
 */
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

/**
 * Get the argument after a function
 * @param {Element} node - The node to check
 * @param {string} functionName - The function name
 * @return {string} - The argument
 */
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

/**
 * Get content from a node, handling special cases
 * @param {Element} node - The node to extract content from
 * @return {string} - Text content or special handling result
 */
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
 * Extract characters from useNodes
 * @param {NodeList} useNodes - List of USE elements to extract from
 * @return {string} - Extracted characters
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

/**
 * Get Unicode mapping for a code point
 * @param {string} codePoint - The Unicode code point
 * @return {string} - Mapped character or placeholder
 */
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

/**
 * Check if node is the start of a function name
 * @param {Element} node - The node to check
 * @return {boolean} - True if function name start, false otherwise
 */
function isFunctionNameStart(node) {
    // Check if this node is part of a recognized function name sequence
    const parent = node.parentNode;
    if (!parent) return false;
    
    // Try to extract a potential function name
    const potentialFunction = getTextContent(parent);
    return isStandardFunction(potentialFunction);
}

/**
 * Get function name from a sequence
 * @param {Element} startNode - The starting node
 * @return {string} - Function name or empty string
 */
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
    // Skip first and last children (the parentheses)
    const innerContent = processInnerContent(children.slice(1, -1));
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

/**
 * Check if node is an implicit function
 * @param {Element} node - The node to check
 * @return {boolean} - True if implicit function, false otherwise
 */
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

/**
 * Process argument parentheses
 * @param {Element} node - The node to process
 * @return {string} - LaTeX representation
 */
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

/**
 * Check if node is the start of absolute value
 * @param {Element} node - The node to check
 * @return {boolean} - True if start of abs value, false otherwise
 */
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

/**
 * Check if node is the end of absolute value
 * @param {Element} node - The node to check
 * @return {boolean} - True if end of abs value, false otherwise
 */
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
 * Define unicode_to_tex fallback in case it's not defined
 */
if (typeof unicode_to_tex === 'undefined') {
    console.log('[INFO] Creating fallback unicode_to_tex mapping');
    window.unicode_to_tex = {};
}
