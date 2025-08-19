/**
 * MathML to LaTeX Translator - Refactored Version
 * This file coordinates the conversion using modular components
 */

// Wait for dependencies to be loaded in browser context
(function() {
  // In browser context, dependencies are loaded via script tags in order
  // Check if we're in a browser or Node.js environment
  const isBrowser = typeof window !== 'undefined';
  
  let logger, nodeProcessor, OPERATOR_MAPPINGS, functions, svgConverter, chtmlConverter;
  
  if (isBrowser) {
    // Browser context - wait for dependencies to be available
    const waitForDependencies = function() {
      if (typeof window.conversionLogger !== 'undefined' &&
          typeof window.nodeProcessor !== 'undefined' &&
          typeof window.OPERATOR_MAPPINGS !== 'undefined' &&
          typeof window.isStandardFunction !== 'undefined' &&
          typeof window.svgConverter !== 'undefined' &&
          typeof window.chtmlConverter !== 'undefined') {
        
        logger = window.conversionLogger;
        nodeProcessor = window.nodeProcessor;
        OPERATOR_MAPPINGS = window.OPERATOR_MAPPINGS;
        functions = { isStandardFunction: window.isStandardFunction };
        svgConverter = window.svgConverter;
        chtmlConverter = window.chtmlConverter;
        
        // Now define the main functions
        defineMainFunctions();
      } else {
        // Dependencies not ready yet, try again
        setTimeout(waitForDependencies, 10);
      }
    };
    
    waitForDependencies();
  } else {
    // Node.js context (for testing)
    logger = require('./modules/logger.js');
    nodeProcessor = require('./modules/node-processor.js');
    OPERATOR_MAPPINGS = require('./config/operators.js').OPERATOR_MAPPINGS;
    functions = { isStandardFunction: require('./config/functions.js').isStandardFunction };
    svgConverter = require('./modules/svg-converter.js');
    chtmlConverter = require('./modules/chtml-converter.js');
    
    defineMainFunctions();
  }
  
  function defineMainFunctions() {
    /**
     * Main conversion function
     * @param {Element} node - The MathML/MathJax node to convert
     * @return {string} - LaTeX representation
     */
    function convertMathMLToLatex(node) {
      // Check if this is CHTML format
      if (isCHTMLFormat(node)) {
        const isTopLevel = !logger.conversionInProgress;
        
        if (isTopLevel) {
          logger.startConversion('CHTML');
          tryLogAriaLabel(node);
        }
        
        // Process CHTML format
        const result = chtmlConverter.convertCHTMLNode(node, logger, nodeProcessor, OPERATOR_MAPPINGS, functions);
        
        if (isTopLevel) {
          logger.endConversion('CHTML');
          return nodeProcessor.fixParentheses(result);
        }
        
        return result;
      }
      
      // Handle SVG format
      const nodeType = node.getAttribute ? node.getAttribute('data-mml-node') : 'none';
      const isTopLevel = !logger.conversionInProgress;
      
      if (isTopLevel) {
        logger.startConversion('SVG');
        tryLogAriaLabel(node);
        
        if (typeof debugPrintSVGElement === 'function') {
          debugPrintSVGElement(node, 0);
        }
      }
      
      // Skip certain nodes
      if (!node || node.nodeType !== 1) {
        if (isTopLevel) logger.conversionInProgress = false;
        return node && node.nodeType === 3 ? node.textContent.trim() : '';
      }
      
      // Skip non-content elements
      if (node.tagName && ['use', 'rect'].includes(node.tagName.toLowerCase())) {
        if (isTopLevel) logger.conversionInProgress = false;
        return '';
      }
      
      // Process the node
      let result = '';
      
      if (!nodeType) {
        result = nodeProcessor.processChildren(node, convertMathMLToLatex);
      } else if (nodeType === 'math') {
        result = nodeProcessor.processChildren(node, convertMathMLToLatex);
        if (isTopLevel) {
          logger.endConversion('MathJax');
          logger.conversionInProgress = false;
          return nodeProcessor.fixParentheses(result);
        }
        return result;
      } else {
        // Use SVG converter for all other node types
        result = svgConverter.convertSVGNode(node, logger, nodeProcessor, OPERATOR_MAPPINGS, functions);
      }
      
      if (isTopLevel) {
        logger.conversionInProgress = false;
        return nodeProcessor.fixParentheses(result);
      }
      
      return result;
    }
    
    /**
     * Detects if the provided node is part of CHTML format MathJax
     */
    function isCHTMLFormat(node) {
      if (!node || !node.tagName) return false;
      
      const tagName = node.tagName.toLowerCase();
      
      if (tagName === 'mjx-container' && 
          node.getAttribute && node.getAttribute('jax') === 'CHTML') {
        return true;
      }
      
      if (tagName.startsWith('mjx-')) {
        if (node.closest && (node.closest('mjx-math') || node.closest('mjx-container[jax="CHTML"]'))) {
          return true;
        }
      }
      
      return false;
    }
    
    /**
     * Try to log aria-label for debugging
     */
    function tryLogAriaLabel(node) {
      try {
        if (node.getAttribute && node.getAttribute('aria-label') && !logger.loggedExpression) {
          const ariaLabel = node.getAttribute('aria-label');
          logger.input(ariaLabel);
        } else if (node.querySelector && node.querySelector('mjx-assistive-mml')) {
          const assistiveMML = node.querySelector('mjx-assistive-mml');
          if (assistiveMML && assistiveMML.textContent) {
            logger.input(assistiveMML.textContent.trim(), 'assistive MML');
          }
        } else if (node.closest) {
          const mjxContainer = node.closest('mjx-container');
          if (mjxContainer && mjxContainer.getAttribute('aria-label') && !logger.loggedExpression) {
            const ariaLabel = mjxContainer.getAttribute('aria-label');
            logger.input(ariaLabel);
          }
        }
      } catch(e) {
        // Ignore errors in accessing aria-label
      }
    }
    
    /**
     * Debug print SVG element structure (simplified version)
     */
    function debugPrintSVGElement(element, indentLevel) {
      if (!element || indentLevel > 10) return;
      
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
        // Already handled in attributes
      } else if (element.textContent && element.children && element.children.length === 0) {
        content = ` | Content: "${element.textContent.trim()}"`;
      }
      
      logger.debug(`${indent}<${tagName}${attributes}>${content}`);
      
      if (element.childNodes) {
        element.childNodes.forEach(child => {
          if (child.nodeType === 1) {
            debugPrintSVGElement(child, indentLevel + 1);
          }
        });
      }
    }
    
    /**
     * Get all MML nodes (helper function)
     */
    function getAllMMLNodes(node) {
      if (node && typeof node.querySelectorAll === 'function') {
        return node.querySelectorAll('[data-mml-node]');
      }
      return [];
    }
    
    /**
     * Wrapper for assistive MathML conversion (for backwards compatibility)
     */
    function convertMathMLFromAssistiveMML(mathmlNode) {
      // This function is called from content.js, so we maintain it for compatibility
      // It delegates to the CHTML converter's assistive MathML handler
      return chtmlConverter.convertCHTMLNode(mathmlNode, logger, nodeProcessor, OPERATOR_MAPPINGS, functions);
    }
    
    // Export functions
    if (isBrowser) {
      // Make functions available globally for browser context
      window.convertMathMLToLatex = convertMathMLToLatex;
      window.convertMathMLFromAssistiveMML = convertMathMLFromAssistiveMML;
      window.isCHTMLFormat = isCHTMLFormat;
      window.debugPrintSVGElement = debugPrintSVGElement;
      window.getAllMMLNodes = getAllMMLNodes;
      
      // Define unicode_to_tex fallback if not defined
      if (typeof unicode_to_tex === 'undefined') {
        logger.info('Creating fallback unicode_to_tex mapping');
        window.unicode_to_tex = {};
      }
    } else {
      // Node.js exports
      module.exports = {
        convertMathMLToLatex,
        convertMathMLFromAssistiveMML,
        isCHTMLFormat,
        debugPrintSVGElement,
        getAllMMLNodes
      };
    }
  }
})();
