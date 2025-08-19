/**
 * CHTML MathJax to LaTeX converter
 */

/**
 * Convert CHTML MathJax node to LaTeX
 */
function convertCHTMLNode(node, logger, nodeProcessor, operators, functions) {
  if (!node) return '';
  
  // Check for assistive MathML first
  if (node.querySelector && node.querySelector('mjx-assistive-mml math')) {
    const mathmlNode = node.querySelector('mjx-assistive-mml math');
    return convertAssistiveMathML(mathmlNode, logger, nodeProcessor, operators, functions);
  }
  
  const tagName = node.tagName ? node.tagName.toLowerCase() : '';
  
  // Handle different CHTML elements with configuration object
  const handlers = {
    'mjx-container': () => {
      const mathElem = node.querySelector && node.querySelector('mjx-math');
      return mathElem ? convertCHTMLNode(mathElem, logger, nodeProcessor, operators, functions) : '';
    },
    
    'mjx-math': () => nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions)),
    
    'mjx-mi': () => handleCHTMLIdentifier(node, nodeProcessor, functions),
    
    'mjx-mo': () => handleCHTMLOperator(node, nodeProcessor, operators),
    
    'mjx-mn': () => nodeProcessor.getCHTMLContent(node),
    
    'mjx-mfrac': () => handleCHTMLFraction(node, logger, nodeProcessor, operators, functions),
    'mjx-frac': () => handleCHTMLFraction(node, logger, nodeProcessor, operators, functions),
    
    'mjx-msqrt': () => handleCHTMLSqrt(node, logger, nodeProcessor, operators, functions),
    'mjx-sqrt': () => handleCHTMLSqrt(node, logger, nodeProcessor, operators, functions),
    
    'mjx-msup': () => handleCHTMLSuperscript(node, logger, nodeProcessor, operators, functions),
    
    'mjx-msub': () => handleCHTMLSubscript(node, logger, nodeProcessor, operators, functions),
    
    'mjx-texatom': () => nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions)),
    
    'mjx-mrow': () => nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions)),
    
    'mjx-box': () => nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions))
  };
  
  // Check if we have a handler
  const handler = handlers[tagName];
  if (handler) {
    return handler();
  }
  
  // Handle generic mjx- elements
  if (tagName.startsWith('mjx-')) {
    return nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
  }
  
  // Handle text nodes
  if (node.nodeType === 3) {
    return node.textContent.trim();
  }
  
  // Default: process children
  if (node.childNodes) {
    return nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
  }
  
  return '';
}

function handleCHTMLIdentifier(node, nodeProcessor, functions) {
  const textContent = nodeProcessor.getCHTMLContent(node);
  
  if (textContent === 'π') return '\\pi ';
  if (functions.isStandardFunction(textContent)) {
    return '\\' + textContent;
  }
  
  return textContent;
}

function handleCHTMLOperator(node, nodeProcessor, operators) {
  const op = nodeProcessor.getCHTMLContent(node);
  return operators[op] !== undefined ? operators[op] : op;
}

function handleCHTMLFraction(node, logger, nodeProcessor, operators, functions) {
  let numerator = '';
  let denominator = '';
  
  if (node.tagName.toLowerCase() === 'mjx-mfrac') {
    const fracNode = node.querySelector && node.querySelector('mjx-frac');
    if (fracNode) {
      return handleCHTMLFraction(fracNode, logger, nodeProcessor, operators, functions);
    }
  } else if (node.tagName.toLowerCase() === 'mjx-frac') {
    const numNode = node.querySelector && node.querySelector('mjx-num');
    if (numNode) {
      numerator = nodeProcessor.processChildren(numNode, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
    }
    
    const denNode = node.querySelector && node.querySelector('mjx-den');
    if (denNode) {
      denominator = nodeProcessor.processChildren(denNode, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
    }
    
    return '\\frac{' + numerator + '}{' + denominator + '}';
  }
  
  return nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
}

function handleCHTMLSqrt(node, logger, nodeProcessor, operators, functions) {
  let content = '';
  
  if (node.tagName.toLowerCase() === 'mjx-msqrt') {
    for (const child of node.childNodes) {
      if (child.tagName && child.tagName.toLowerCase() !== 'mjx-sqrt') {
        content += convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
      }
    }
    return '\\sqrt{' + content + '}';
  } else if (node.tagName.toLowerCase() === 'mjx-sqrt') {
    const boxElem = node.querySelector && node.querySelector('mjx-box');
    if (boxElem) {
      content = nodeProcessor.processChildren(boxElem, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
    } else {
      for (const child of node.childNodes) {
        if (child.tagName && child.tagName.toLowerCase() !== 'mjx-surd') {
          content += convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
        }
      }
    }
    return '\\sqrt{' + content + '}';
  }
  
  return nodeProcessor.processChildren(node, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
}

function handleCHTMLSuperscript(node, logger, nodeProcessor, operators, functions) {
  let base = '';
  let exponent = '';
  
  let baseFound = false;
  
  for (const child of node.childNodes) {
    if (child.nodeType !== 1) continue;
    
    if (!baseFound) {
      base = convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
      baseFound = true;
    } else {
      if (child.tagName && child.tagName.toLowerCase() === 'mjx-script') {
        exponent = nodeProcessor.processChildren(child, (subchild) => convertCHTMLNode(subchild, logger, nodeProcessor, operators, functions));
      } else {
        exponent = convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
      }
      break;
    }
  }
  
  if (!exponent) {
    const scriptElem = node.querySelector && node.querySelector('mjx-script');
    if (scriptElem) {
      exponent = nodeProcessor.processChildren(scriptElem, (child) => convertCHTMLNode(child, logger, nodeProcessor, operators, functions));
    }
  }
  
  return base + '^{' + (exponent || '2') + '}';
}

function handleCHTMLSubscript(node, logger, nodeProcessor, operators, functions) {
  let base = '';
  let subscript = '';
  
  let baseFound = false;
  for (const child of node.childNodes) {
    if (child.nodeType !== 1) continue;
    
    if (!baseFound) {
      base = convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
      baseFound = true;
    } else {
      if (child.tagName && child.tagName.toLowerCase() === 'mjx-script') {
        subscript = convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
      } else {
        subscript = convertCHTMLNode(child, logger, nodeProcessor, operators, functions);
      }
      break;
    }
  }
  
  return base + '_{' + subscript + '}';
}

/**
 * Convert MathML from assistive MML structure to LaTeX
 */
function convertAssistiveMathML(mathmlNode, logger, nodeProcessor, operators, functions) {
  if (!mathmlNode) {
    logger.debug('convertAssistiveMathML: Encountered null node, returning empty string.');
    return '';
  }

  const nodeName = mathmlNode.nodeName.toLowerCase();
  
  // Handler mapping for different MathML elements
  const handlers = {
    'math': () => nodeProcessor.processChildren(mathmlNode, (child) => convertAssistiveMathML(child, logger, nodeProcessor, operators, functions)),
    
    'mi': () => {
      const identifier = mathmlNode.textContent.trim();
      const mathvariant = mathmlNode.getAttribute && mathmlNode.getAttribute('mathvariant');
      
      if (identifier === 'π') return '\\pi ';
      if (identifier === '∂') return '\\partial ';
      if (functions.isStandardFunction(identifier)) return '\\' + identifier + ' ';
      if (mathvariant === 'bold') return '\\mathbf{' + identifier + '}';
      if (mathvariant === 'normal' && identifier === '∇') return '\\nabla ';
      return identifier;
    },
    
    'mo': () => {
      const op = mathmlNode.textContent.trim();
      return operators[op] !== undefined ? operators[op].trim() : op;
    },
    
    'mn': () => mathmlNode.textContent.trim(),
    
    'mfrac': () => {
      const children = Array.from(mathmlNode.children || []);
      if (children.length >= 2) {
        const numerator = convertAssistiveMathML(children[0], logger, nodeProcessor, operators, functions);
        const denominator = convertAssistiveMathML(children[1], logger, nodeProcessor, operators, functions);
        return '\\frac{' + numerator + '}{' + denominator + '}';
      }
      return nodeProcessor.processChildren(mathmlNode, (child) => convertAssistiveMathML(child, logger, nodeProcessor, operators, functions));
    },
    
    'msqrt': () => {
      const content = nodeProcessor.processChildren(mathmlNode, (child) => convertAssistiveMathML(child, logger, nodeProcessor, operators, functions));
      return '\\sqrt{' + content + '}';
    },
    
    'msup': () => {
      const children = Array.from(mathmlNode.children || []);
      if (children.length >= 2) {
        const base = convertAssistiveMathML(children[0], logger, nodeProcessor, operators, functions);
        const exponent = convertAssistiveMathML(children[1], logger, nodeProcessor, operators, functions);
        return base + '^{' + exponent + '}';
      }
      return mathmlNode.textContent.trim();
    },
    
    'msub': () => {
      const children = Array.from(mathmlNode.children || []);
      if (children.length >= 2) {
        const base = convertAssistiveMathML(children[0], logger, nodeProcessor, operators, functions);
        const subscript = convertAssistiveMathML(children[1], logger, nodeProcessor, operators, functions);
        return base + '_{' + subscript + '}';
      }
      return mathmlNode.textContent.trim();
    },
    
    'mrow': () => nodeProcessor.processChildren(mathmlNode, (child) => convertAssistiveMathML(child, logger, nodeProcessor, operators, functions)),
    
    'mtext': () => mathmlNode.textContent.trim(),
    
    'mover': () => {
      const children = Array.from(mathmlNode.children || []);
      if (children.length >= 2) {
        const base = convertAssistiveMathML(children[0], logger, nodeProcessor, operators, functions);
        const overContent = children[1].textContent.trim();
        
        const isVector = overContent === '\u20D7';
        const isOverline = overContent === '\u0305' || (mathmlNode.getAttribute && mathmlNode.getAttribute('data-semantic-type') === 'overscore');
        
        if (isVector) return '\\overrightarrow{' + base + '}';
        if (isOverline) return '\\overline{' + base + '}';
        
        const over = convertAssistiveMathML(children[1], logger, nodeProcessor, operators, functions);
        return base + (over.trim() ? '^{' + over + '}' : '');
      }
      return nodeProcessor.processChildren(mathmlNode, (child) => convertAssistiveMathML(child, logger, nodeProcessor, operators, functions));
    },
    
    '#text': () => {
      const text = mathmlNode.textContent.trim();
      return text || '';
    }
  };
  
  const handler = handlers[nodeName];
  if (handler) {
    return handler();
  }
  
  // Default: process children
  return nodeProcessor.processChildren(mathmlNode, (child) => convertAssistiveMathML(child, logger, nodeProcessor, operators, functions));
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertCHTMLNode };
} else {
  window.chtmlConverter = { convertCHTMLNode };
}