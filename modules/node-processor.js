/**
 * Common node processing utilities
 */

/**
 * Process children nodes
 * @param {Element} node - The parent node
 * @param {Function} converter - The conversion function to use
 * @return {string} - LaTeX representation of children
 */
function processChildren(node, converter) {
  if (!node || !node.childNodes) return '';
  
  let result = '';
  for (const child of node.childNodes) {
    result += converter(child);
  }
  return result;
}

/**
 * Get content from a node, handling special cases
 * @param {Element} node - The node to extract content from
 * @return {string} - Text content or special handling result
 */
function getNodeContent(node) {
  if (!node) return '';
  
  // Check for text content first
  if (node.textContent) {
    const content = node.textContent.trim();
    if (content) return content;
  }
  
  // Check for text element
  const textElem = node.querySelector && node.querySelector('text');
  if (textElem) {
    return textElem.textContent.trim();
  }
  
  // Check for use element with data-c attribute
  const useElem = findUseElement(node);
  if (useElem) {
    const dataC = getDataCAttribute(useElem);
    if (dataC) {
      return getUnicodeMapping(dataC);
    }
  }
  
  return '';
}

/**
 * Find use element in node
 */
function findUseElement(node) {
  if (!node) return null;
  
  // Try querySelector
  if (node.querySelector) {
    const elem = node.querySelector('use');
    if (elem) return elem;
  }
  
  // Check children
  if (node.children) {
    for (const child of node.children) {
      if (child.tagName && child.tagName.toLowerCase() === 'use') {
        return child;
      }
    }
  }
  
  // Check childNodes
  if (node.childNodes) {
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && child.tagName && child.tagName.toLowerCase() === 'use') {
        return child;
      }
    }
  }
  
  return null;
}

/**
 * Get data-c attribute from element
 */
function getDataCAttribute(elem) {
  if (!elem) return null;
  
  // Try getAttribute
  if (elem.getAttribute) {
    const dataC = elem.getAttribute('data-c');
    if (dataC) return dataC;
  }
  
  // Fallback: parse HTML
  const html = elem.outerHTML || '';
  const match = html.match(/data-c="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * Get Unicode mapping for a code point
 */
function getUnicodeMapping(codePoint) {
  const formattedCodePoint = "U+" + codePoint.toUpperCase().padStart(4, '0');
  
  // Check if unicode_to_tex exists and has mapping
  if (typeof unicode_to_tex !== 'undefined' && unicode_to_tex[formattedCodePoint]) {
    return unicode_to_tex[formattedCodePoint];
  }
  
  // Try to convert to character
  try {
    const codePointInt = parseInt(codePoint, 16);
    if (!isNaN(codePointInt)) {
      const char = String.fromCodePoint(codePointInt);
      // Add space unless it's a combining character
      if ((codePointInt >= 0x0300 && codePointInt <= 0x036F) ||
          (codePointInt >= 0x20D0 && codePointInt <= 0x20FF)) {
        return char;
      }
      return char + ' ';
    }
  } catch (e) {
    // Ignore conversion errors
  }
  
  return `[${formattedCodePoint}]`;
}

/**
 * Check if node is a parenthesized expression
 */
function isParenthesizedExpression(node) {
  if (!node || node.getAttribute && node.getAttribute('data-mml-node') !== 'mrow') return false;
  
  const children = Array.from(node.children || []);
  if (children.length < 2) return false;
  
  const firstChild = children[0];
  const lastChild = children[children.length - 1];
  
  return firstChild.getAttribute && firstChild.getAttribute('data-mml-node') === 'mo' && 
         getNodeContent(firstChild) === '(' &&
         lastChild.getAttribute && lastChild.getAttribute('data-mml-node') === 'mo' && 
         getNodeContent(lastChild) === ')';
}

/**
 * Process inner content of nodes
 */
function processInnerContent(children, converter) {
  return children.map(child => converter(child)).join('');
}

/**
 * Extract CHTML content from element
 */
function getCHTMLContent(node) {
  const mjxCElems = node.querySelectorAll && node.querySelectorAll('mjx-c');
  if (mjxCElems && mjxCElems.length > 0) {
    return Array.from(mjxCElems).map(elem => {
      const classAttr = elem.getAttribute && elem.getAttribute('class');
      if (classAttr && classAttr.includes('mjx-c')) {
        const match = classAttr.match(/mjx-c([0-9A-F]+)/);
        if (match && match[1]) {
          try {
            const codePoint = parseInt(match[1], 16);
            if (codePoint) {
              return String.fromCodePoint(codePoint);
            }
          } catch (e) {
            // Ignore errors
          }
        }
      }
      return elem.textContent || '';
    }).join('');
  }
  
  return node.textContent ? node.textContent.trim() : '';
}

/**
 * Replaces standalone parentheses with \left( and \right) in the final LaTeX string
 */
function fixParentheses(latexString) {
  if (!latexString) return '';
  
  const leftPlaceholder = "@@LEFT_PAREN@@";
  const rightPlaceholder = "@@RIGHT_PAREN@@";
  
  // Replace existing \left( and \right) with placeholders
  let processedString = latexString.replace(/\\left\(/g, leftPlaceholder);
  processedString = processedString.replace(/\\right\)/g, rightPlaceholder);
  
  // Replace standalone ( and )
  processedString = processedString.replace(/\(/g, '\\left(');
  processedString = processedString.replace(/\)/g, '\\right)');
  
  // Restore the original \left( and \right)
  processedString = processedString.replace(new RegExp(leftPlaceholder, 'g'), '\\left(');
  processedString = processedString.replace(new RegExp(rightPlaceholder, 'g'), '\\right)');
  
  return processedString;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    processChildren,
    getNodeContent,
    findUseElement,
    getDataCAttribute,
    getUnicodeMapping,
    isParenthesizedExpression,
    processInnerContent,
    getCHTMLContent,
    fixParentheses
  };
} else {
  window.nodeProcessor = {
    processChildren,
    getNodeContent,
    findUseElement,
    getDataCAttribute,
    getUnicodeMapping,
    isParenthesizedExpression,
    processInnerContent,
    getCHTMLContent,
    fixParentheses
  };
}