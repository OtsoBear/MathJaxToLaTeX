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
    
    'semantics': () => {
      // Process only the first child (presentation MathML), ignoring annotations
      if (node.children && node.children.length > 0) {
        // Get the first mrow child which contains the actual math
        const mrowChild = node.children[0];
        
        // Check if this contains a cases environment (mfenced with mtable)
        const hasMfenced = mrowChild.querySelector && mrowChild.querySelector('[data-mml-node="mfenced"]');
        if (hasMfenced) {
          // Process only the mfenced, ignore siblings (comma and text that follow)
          const mfenced = Array.from(mrowChild.children || []).find(child =>
            child.getAttribute && child.getAttribute('data-mml-node') === 'mfenced'
          );
          
          if (mfenced) {
            // Get any text that follows for inclusion in the cases
            const siblings = Array.from(mrowChild.children || []);
            const mfencedIndex = siblings.indexOf(mfenced);
            let commaAndText = '';
            
            for (let i = mfencedIndex + 1; i < siblings.length; i++) {
              const sibling = siblings[i];
              const nodeType = sibling.getAttribute && sibling.getAttribute('data-mml-node');
              
              if (nodeType === 'mo') {
                const content = nodeProcessor.getNodeContent(sibling).trim();
                logger.debug('Found mo node with content: "' + content + '"');
                if (content === ',') {
                  commaAndText += '{,}';
                  logger.debug('Found comma in semantics');
                }
              } else if (nodeType === 'mtext') {
                const text = nodeProcessor.getNodeContent(sibling).trim();
                if (text) {
                  // Normalize non-breaking spaces to regular spaces
                  const normalizedText = text.replace(/\u00A0/g, ' ');
                  commaAndText += '\\ \\text{' + normalizedText + '}';
                  logger.debug('Found text in semantics: ' + normalizedText);
                }
              } else if (nodeType === 'mi') {
                // Variable like 't' - use single backslash for spacing
                const varContent = nodeProcessor.getNodeContent(sibling);
                commaAndText += '\\ ' + varContent;
                logger.debug('Found variable in semantics: ' + varContent);
              }
            }
            
            logger.debug('Comma and text to append: ' + commaAndText);
            
            // Pass the text to mfenced handler
            return handleMfenced(mfenced, logger, nodeProcessor, operators, functions, commaAndText);
          }
        }
        
        return convertSVGNode(node.children[0], logger, nodeProcessor, operators, functions);
      }
      return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
    },
    
    'mfenced': () => handleMfenced(node, logger, nodeProcessor, operators, functions),
    
    'mtable': () => handleMtable(node, logger, nodeProcessor, operators, functions),
    
    'mtr': () => handleMtr(node, logger, nodeProcessor, operators, functions),
    
    'mtd': () => nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions)),
    
    'mrow': () => handleMrow(node, logger, nodeProcessor, operators, functions),
    
    'mi': () => handleMi(node, nodeProcessor, functions),
    
    'mn': () => nodeProcessor.getNodeContent(node),
    
    'mo': () => handleMo(node, nodeProcessor, operators),
    
    'mtext': () => {
      const text = nodeProcessor.getNodeContent(node).trim();
      // Handle special characters
      if (text === 'π') {
        return '\\pi ';
      } else if (text === 'd') {
        // Don't wrap 'd' in \text{} for differentials
        return 'd';
      } else if (text) {
        // Normalize non-breaking spaces to regular spaces
        const normalizedText = text.replace(/\u00A0/g, ' ');
        // Wrap other text in \text{}
        return '\\text{' + normalizedText + '}';
      }
      return text;
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

function handleMfenced(node, logger, nodeProcessor, operators, functions, appendText = '') {
  logger.debug('Processing mfenced node with appendText: ' + appendText);
  
  // Check if this is a system of equations (cases)
  // Look for mtable inside mfenced's children
  const mrowChild = Array.from(node.children || []).find(child =>
    child.getAttribute && child.getAttribute('data-mml-node') === 'mrow'
  );
  
  let mtable = null;
  if (mrowChild) {
    mtable = Array.from(mrowChild.children || []).find(child =>
      child.getAttribute && child.getAttribute('data-mml-node') === 'mtable'
    );
  }
  
  if (mtable) {
    // This is likely a cases environment
    logger.progress('Processing system of equations (cases)');
    
    // Process the table and wrap in \begin{cases}...\end{cases}
    const tableContent = handleMtable(mtable, logger, nodeProcessor, operators, functions, true, appendText);
    // Don't include newlines, they're not needed for LaTeX
    return '\\begin{cases}' + tableContent + '\\end{cases}';
  }
  
  // Default: process as regular fenced content
  const content = nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
  return '\\left\\{' + content + '\\right\\}';
}

function handleMtable(node, logger, nodeProcessor, operators, functions, isCasesEnvironment = false, appendToSecondRow = '') {
  logger.debug('Processing mtable');
  
  const rows = Array.from(node.children || []).filter(child =>
    child.getAttribute && child.getAttribute('data-mml-node') === 'mtr'
  );
  
  if (rows.length === 0) {
    return nodeProcessor.processChildren(node, (child) => convertSVGNode(child, logger, nodeProcessor, operators, functions));
  }
  
  const processedRows = rows.map((row, rowIndex) => {
    const cells = Array.from(row.children || []).filter(child =>
      child.getAttribute && child.getAttribute('data-mml-node') === 'mtd'
    );
    
    const processedCells = cells.map((cell, cellIndex) => {
      let content = nodeProcessor.processChildren(cell, (child) =>
        convertSVGNode(child, logger, nodeProcessor, operators, functions)
      ).trim();
      
      // Remove unwanted spaces in compound expressions
      // For cells containing numbers with operators like "-1" or "7t"
      if (cellIndex === 2 && content.includes('- ')) {
        // Third cell often has negative numbers
        content = content.replace('- ', '-');
      }
      
      // Check if this cell has a number followed by a variable (like "7 t")
      if (content.match(/^\d+\s+[a-z]$/i)) {
        content = content.replace(/\s+/, '');
      }
      
      return content;
    });
    
    // Join cells with & for alignment - this works generically for all table structures
    let rowContent = processedCells.join('&');
    
    // Special handling for the second row in cases environment
    if (isCasesEnvironment && rowIndex === 1 && appendToSecondRow) {
      // Append the comma and text to the second row
      // Fix spacing: between variable and text should be single backslash, not double
      let cleanedAppend = appendToSecondRow;
      
      // Replace pattern: "\ t \ \text{" should become "\ t\ \text{"
      cleanedAppend = cleanedAppend.replace(/\\ ([a-z]) \\ \\text\{/gi, '\\ $1\\ \\text{');
      
      logger.debug('Appending to second row: ' + cleanedAppend);
      rowContent += cleanedAppend;
    }
    
    return rowContent;
  });
  
  // Join rows with \\ for line breaks (no actual newlines needed in LaTeX)
  return processedRows.join('\\\\');
}

function handleMtr(node, logger, nodeProcessor, operators, functions) {
  logger.debug('Processing mtr (table row)');
  
  const cells = Array.from(node.children || []).filter(child =>
    child.getAttribute && child.getAttribute('data-mml-node') === 'mtd'
  );
  
  const processedCells = cells.map(cell =>
    nodeProcessor.processChildren(cell, (child) =>
      convertSVGNode(child, logger, nodeProcessor, operators, functions)
    ).trim()
  );
  
  return processedCells.join(' & ');
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