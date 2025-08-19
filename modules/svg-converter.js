/**
 * SVG MathJax to LaTeX converter
 */

/**
 * Convert SVG MathJax node to LaTeX
 */
function convertSVGNode(node, logger, nodeProcessor, operators, functions) {
  const nodeType = node.getAttribute ? node.getAttribute('data-mml-node') : null;
  
  if (!nodeType) {
    return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
  }
  
  // Handle different node types with a configuration object instead of switch
  const handlers = {
    'math': () => nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions)),
    
    'mrow': () => handleMrow(node, logger, nodeProcessor, operators, functions),
    
    'mi': () => handleMi(node, nodeProcessor, functions),
    
    'mn': () => nodeProcessor.getNodeContent(node),
    
    'mo': () => handleMo(node, nodeProcessor, operators),
    
    'mtext': () => {
      const text = nodeProcessor.getNodeContent(node);
      return text === 'π' ? '\\pi ' : text;
    },
    
    'msqrt': () => {
      const content = nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
      logger.progress('Processed square root');
      return '\\sqrt{' + content.trim() + '}';
    },
    
    'mfrac': () => {
      if (node.children && node.children.length >= 2) {
        const num = convertSVGNode(node.children[0], logger, nodeProcessor, operators, functions);
        const den = convertSVGNode(node.children[1], logger, nodeProcessor, operators, functions);
        logger.progress('Processed fraction');
        return '\\frac{' + num + '}{' + den + '}';
      }
      return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
    },
    
    'msup': () => handleSuperscript(node, logger, nodeProcessor, operators, functions),
    
    'msub': () => {
      if (node.children && node.children.length >= 2) {
        const base = convertSVGNode(node.children[0], logger, nodeProcessor, operators, functions);
        const sub = convertSVGNode(node.children[1], logger, nodeProcessor, operators, functions);
        return base + '_{' + sub + '}';
      }
      return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
    },
    
    'munderover': () => handleUnderOver(node, logger, nodeProcessor, operators, functions),
    
    'mover': () => handleOver(node, logger, nodeProcessor, operators, functions),
    
    'mstyle': () => nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions))
  };
  
  const handler = handlers[nodeType];
  if (handler) {
    return handler();
  }
  
  // Default: process children
  logger.debug(`mrow result:`, nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions)).substring(0, 50) + '...');
  return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
}

function handleMrow(node, logger, nodeProcessor, operators, functions) {
  logger.debug('Processing mrow with', node.children ? node.children.length : 0, 'children');
  
  // Check for equality
  if (node.getAttribute && node.getAttribute('data-semantic-role') === "equality") {
    const children = Array.from(node.children || []);
    let equalsIndex = children.findIndex(child => 
      child.getAttribute('data-mml-node') === 'mo' && 
      nodeProcessor.getNodeContent(child) === '='
    );
    
    if (equalsIndex > 0) {
      const leftSide = children.slice(0, equalsIndex);
      const rightSide = children.slice(equalsIndex + 1);
      
      const leftLatex = leftSide.map(child => convertSVGNode(child, logger, nodeProcessor, operators, functions)).join('');
      const rightLatex = rightSide.map(child => convertSVGNode(child, logger, nodeProcessor, operators, functions)).join('');
      
      logger.progress('Processed equation with left and right sides');
      return leftLatex + '=' + rightLatex;
    }
  }
  
  return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
}

function handleMi(node, nodeProcessor, functions) {
  const mi = nodeProcessor.getNodeContent(node);
  if (functions.isStandardFunction(mi)) {
    return '\\' + mi;
  }
  return mi;
}

function handleMo(node, nodeProcessor, operators) {
  const opContent = nodeProcessor.getNodeContent(node);
  return operators[opContent] !== undefined ? operators[opContent] : opContent;
}

function handleSuperscript(node, logger, nodeProcessor, operators, functions) {
  if (node.children && node.children.length >= 2) {
    const base = node.children[0];
    const exp = node.children[1];
    
    let baseText;
    if (nodeProcessor.isParenthesizedExpression(base)) {
      const children = Array.from(base.children || []);
      const innerContent = nodeProcessor.processInnerContent(children.slice(1, -1), (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
      baseText = '(' + innerContent + ')';
    } else {
      baseText = convertSVGNode(base, logger, nodeProcessor, operators, functions);
    }
    
    const expText = convertSVGNode(exp, logger, nodeProcessor, operators, functions);
    
    const needsParens = isCompoundElement(base, nodeProcessor) && !nodeProcessor.isParenthesizedExpression(base);
    
    if (expText === '2') {
      return needsParens ? '(' + baseText + ')^2' : baseText + '^2';
    }
    return needsParens ? 
      '(' + baseText + ')^{' + expText + '}' : 
      baseText + '^{' + expText + '}';
  }
  return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
}

function handleUnderOver(node, logger, nodeProcessor, operators, functions) {
  if (node.children && node.children.length >= 3) {
    const baseOp = node.children[0];
    const underScript = node.children[1];
    const overScript = node.children[2];
    
    const baseOpContent = nodeProcessor.getNodeContent(baseOp);
    const underLatex = convertSVGNode(underScript, logger, nodeProcessor, operators, functions);
    const overLatex = convertSVGNode(overScript, logger, nodeProcessor, operators, functions);
    
    if (baseOpContent === '∫') {
      logger.progress('Processed integral');
      return '\\int_{' + underLatex + '}^{' + overLatex + '}';
    }
    
    return convertSVGNode(baseOp, logger, nodeProcessor, operators, functions) + '_{' + underLatex + '}^{' + overLatex + '}';
  }
  return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
}

function handleOver(node, logger, nodeProcessor, operators, functions) {
  if (node.children && node.children.length >= 2) {
    const base = node.children[0];
    const overscript = node.children[1];
    
    const overscriptContent = nodeProcessor.getNodeContent(overscript);
    const overscriptNode = overscript.querySelector && overscript.querySelector('use[data-c="20D7"]');
    const overlineNode = overscript.querySelector && overscript.querySelector('use[data-c="305"]');
    
    if (overscriptContent === '\u20D7' || overscriptNode) {
      const baseLatex = convertSVGNode(base, logger, nodeProcessor, operators, functions);
      logger.progress('Processed overrightarrow');
      return '\\overrightarrow{' + baseLatex + '}';
    } else if (overscriptContent === '\u0305' || overlineNode || node.getAttribute('data-semantic-type') === 'overscore') {
      const baseLatex = convertSVGNode(base, logger, nodeProcessor, operators, functions);
      logger.progress('Processed overline');
      return '\\overline{' + baseLatex + '}';
    }
    
    const baseLatex = convertSVGNode(base, logger, nodeProcessor, operators, functions);
    const overLatex = convertSVGNode(overscript, logger, nodeProcessor, operators, functions);
    return baseLatex + (overLatex.trim() ? '^{' + overLatex + '}' : '');
  }
  return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
}

function isCompoundElement(node, nodeProcessor) {
  if (!node) return false;
  
  if (node.getAttribute && node.getAttribute('data-mml-node') === 'mrow') {
    const children = Array.from(node.children || []);
    const hasOpenParen = children.some(c => 
      c.getAttribute('data-mml-node') === 'mo' && 
      nodeProcessor.getNodeContent(c) === '(');
    const hasCloseParen = children.some(c => 
      c.getAttribute('data-mml-node') === 'mo' && 
      nodeProcessor.getNodeContent(c) === ')');
    
    if (hasOpenParen && hasCloseParen) {
      return true;
    }
  }
  
  return false;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertSVGNode };
} else {
  window.svgConverter = { convertSVGNode };
}