/**
 * MathJaxToLaTeX - Content Script
 *
 * This script provides functionality for:
 * 1. Converting MathJax elements to LaTeX
 * 2. Enabling copy functionality for MathJax elements
 * 3. Disabling unwanted menu panels on kampus.sanomapro.fi
 * 4. Managing text selection behavior on kampus.sanomapro.fi
 */

// Import utilities (for browser extension context, these would be loaded separately)
// In a real extension, utils.js would be loaded before content.js in manifest.json

// Configuration
const CONFIG = {
  copiedFeedbackDuration: 2000, // Duration to show "Copied!" feedback in ms
  styleCheckInterval: 5000,     // Interval to check if style elements are still in place
  domainSpecific: {
    kampus: 'kampus.sanomapro.fi'
  }
};

// Cache for storing previous conversions
let conversionCache = {
  input: null,
  result: null
};

// Store cleanup functions and observers
let cleanupFunctions = [];
let observers = {
  mathJax: null,
  head: null
};
let intervalIds = [];

/**
 * Converts MathML to LaTeX format
 * @param {string} mathmlInput - The MathML input to convert
 * @returns {string} - The converted LaTeX string
 */
function convertToLatex(mathmlInput) {
  // Use cache if input hasn't changed
  if (mathmlInput === conversionCache.input && conversionCache.result !== null) {
    console.log('[INFO] Using cached LaTeX result');
    return conversionCache.result;
  }
        
  try {
    // Parse the MathML input safely
    const tempDiv = safeParseHTML(mathmlInput);
    
    // Find the math node
    const mathNode = tempDiv.querySelector('[data-mml-node="math"]');
    if (!mathNode) {
      console.log('[ERROR] No valid MathML found in input');
      return "No valid MathML found!";
    }
    
    console.log('[INFO] Starting LaTeX conversion');
    
    // Convert to LaTeX using the function from translate.js
    const latex = convertMathMLToLatex(mathNode);
    
    // Cache the result
    conversionCache.input = mathmlInput;
    conversionCache.result = latex;
    
    // No need to log this if already logged in translate.js
    return latex;
  } catch (error) {
    console.error('[ERROR] LaTeX Conversion Failed:', error);
    return `Error converting MathML: ${error.message}`;
  }
}

/**
 * Sets up overlay functionality for MathJax elements
 */
function setupMathJaxOverlay() {
  // Find both standard MathJax containers and g elements with data-mml-node="math"
  const mathJaxContainers = document.querySelectorAll('mjx-container.MathJax:not(.mathjax-copyable)');
  const mathGElements = document.querySelectorAll('g[data-mml-node="math"]');
  
  // Process standard MathJax containers
  mathJaxContainers.forEach(element => {
    element.classList.add('mathjax-copyable');
    
    const clickHandler = function(event) {
      // Get the aria-label for user feedback
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        console.log('[INFO] Clicked math expression: "' + ariaLabel + '"');
      }
      
      // Check if this is CHTML or SVG format
      const jaxType = element.getAttribute('jax') || '';
      
      if (jaxType.toUpperCase() === 'CHTML') {
        // Handle CHTML format
        console.log('[INFO] Processing CHTML format MathJax');
        
        // Option 1: If assistive MathML is available, we can use it directly
        const assistiveMML = element.querySelector('mjx-assistive-mml math');
        if (assistiveMML) {
          console.log('[INFO] Using assistive MathML for conversion');
          
          // Log the assistive MathML structure to help debug
          console.log('[DEBUG] Assistive MathML:', assistiveMML.outerHTML);
          
          try {
            // Use the specialized assistive MathML processor directly here
            const latexContent = convertMathMLFromAssistiveMML(assistiveMML);
            console.log('[DEBUG] Generated LaTeX:', latexContent);
            
            copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard');
          } catch (error) {
            console.error('[ERROR] Error converting assistive MathML:', error);
            
            // Fallback: try direct MathML from assistive-mml
            try {
              const mathML = assistiveMML.outerHTML;
              const tempDiv = safeParseHTML(mathML);
              
              // Try fallback direct processing
              const latexContent = processAssistiveMathML(tempDiv.querySelector('math'));
              console.log('[DEBUG] Fallback LaTeX:', latexContent);
              
              copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard (fallback)');
            } catch (fallbackError) {
              console.error('[ERROR] Fallback conversion also failed:', fallbackError);
              // Final fallback: use the aria-label attribute
              copyAriaLabelAsText(element);
            }
          }
          
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        
        // Option 2: Use the CHTML structure directly
        const mathElement = element.querySelector('mjx-math');
        if (mathElement) {
          console.log('[INFO] Using CHTML structure for conversion');
          const latexContent = convertMathMLToLatex(element);
          
          copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard');
          
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
      
      // Original SVG handling
      const mathElements = element.querySelectorAll('g[data-mml-node="math"]');
      
      if (mathElements.length > 0) {
        let htmlContent = '';
        mathElements.forEach(math => {
          htmlContent += math.outerHTML;
        });
        
        if (htmlContent) {
          const latexContent = convertToLatex(htmlContent);
          copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard');
        }
      } else {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          copyToClipboardWithFeedback(ariaLabel, element, 'Copied aria-label to clipboard');
        }
      }
      
      event.preventDefault();
      event.stopPropagation();
    };
    
    element.addEventListener('click', clickHandler);
    
    // Store cleanup function
    cleanupFunctions.push(() => {
      element.removeEventListener('click', clickHandler);
    });
  });
  
  // Process g elements with data-mml-node="math"
  mathGElements.forEach(element => {
    // Skip if already inside a processed mjx-container
    if (element.closest('mjx-container.mathjax-copyable')) {
      return;
    }
    
    // Find closest parent that can be made clickable (SVG or containing div)
    const clickableParent = element.closest('svg') || element.parentElement;
    if (!clickableParent) return;
    
    clickableParent.classList.add('mathjax-copyable');
    
    const clickHandler = function(event) {
      // Use the math element directly
      const htmlContent = element.outerHTML;
      
      if (htmlContent) {
        const latexContent = convertToLatex(htmlContent);
        copyToClipboardWithFeedback(latexContent, clickableParent, 'Copied to clipboard');
      }
      
      event.preventDefault();
      event.stopPropagation();
    };
    
    clickableParent.addEventListener('click', clickHandler);
    
    // Store cleanup function
    cleanupFunctions.push(() => {
      clickableParent.removeEventListener('click', clickHandler);
    });
  });
}

/**
 * Direct assistive MathML parsing as fallback
 */
function processAssistiveMathML(mathNode) {
  if (!mathNode) return 'No math node found';
  
  // Process direct MathML - simpler approach focused on key structures
  function processMathNode(node) {
    if (!node) return '';
    
    if (node.nodeType === 3) { // Text node
      return node.textContent.trim();
    }
    
    const nodeName = node.nodeName.toLowerCase();
    
    // Handle different MathML elements
    switch (nodeName) {
      case 'mfrac':
        const numNode = node.firstElementChild;
        const denNode = node.lastElementChild;
        if (numNode && denNode) {
          return '\\frac{' + processMathNode(numNode) + '}{' + processMathNode(denNode) + '}';
        }
        break;
        
      case 'msqrt':
        let sqrtContent = '';
        for (const child of node.childNodes) {
          sqrtContent += processMathNode(child);
        }
        return '\\sqrt{' + sqrtContent + '}';
        
      case 'msup':
        const baseNode = node.firstElementChild;
        const supNode = node.lastElementChild;
        if (baseNode && supNode) {
          const base = processMathNode(baseNode);
          const exp = processMathNode(supNode);
          return base + '^{' + exp + '}';
        }
        break;
        
      case 'mo':
        const op = node.textContent.trim();
        if (op === '±') return '\\pm';
        if (op === '×') return '\\times';
        return op;
        
      case 'mi':
      case 'mn':
      case 'mtext':
        return node.textContent.trim();
    }
    
    // Default: process all children
    let result = '';
    for (const child of node.childNodes) {
      result += processMathNode(child);
    }
    return result;
  }
  
  return processMathNode(mathNode);
}

/**
 * Fallback to just copying the aria-label text
 */
function copyAriaLabelAsText(element) {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    copyToClipboardWithFeedback(ariaLabel, element, 'Copied aria-label to clipboard as fallback');
  } else {
    alert('Could not parse the math expression');
  }
}

// Utilities
/**
 * Checks if the current page is on the kampus.sanomapro.fi domain
 * @returns {boolean} - True if on kampus domain
 */
function isOnKampusDomain() {
  return window.location.hostname === CONFIG.domainSpecific.kampus;
}

// Helper functions that would normally be imported from utils.js
// In a real extension, these would come from the utils module

/**
 * Safely parse HTML string using DOMParser
 * @param {string} htmlString - The HTML string to parse
 * @returns {HTMLElement} - The parsed element
 */
function safeParseHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
  return doc.body.firstChild;
}

/**
 * Copy text to clipboard with feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} element - Element to show feedback near
 * @param {string} successMessage - Success log message
 * @returns {Promise<void>}
 */
async function copyToClipboardWithFeedback(text, element, successMessage = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
    showCopiedFeedback(element);
    console.log(`[SUCCESS] ${successMessage}: ${text}`);
  } catch (err) {
    console.error('[ERROR] Failed to copy: ', err);
  }
}

/**
 * Shows feedback when content is copied
 * @param {HTMLElement} element - The element that was clicked to copy
 */
function showCopiedFeedback(element) {
  const feedback = document.createElement('div');
  feedback.textContent = 'Copied!';
  feedback.className = 'mathjax-copy-feedback';
  
  // Position near the element
  const rect = element.getBoundingClientRect();
  feedback.style.cssText = `
    position: absolute;
    top: ${rect.top + window.scrollY - 30}px;
    left: ${rect.left + window.scrollX}px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 10000;
    animation: fade-out 2s forwards;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
  `;
  
  // Add style for animation if not already present
  if (!document.getElementById('copy-feedback-style')) {
    const style = document.createElement('style');
    style.id = 'copy-feedback-style';
    style.textContent = `
      @keyframes fade-out {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(feedback);
  
  // Remove after animation
  setTimeout(() => {
    feedback.remove();
  }, CONFIG.copiedFeedbackDuration);
}

/**
 * Disables menu panels on kampus.sanomapro.fi using permanent CSS injection
 */
function permanentlyDisableMenuPanels() {
  if (!isOnKampusDomain()) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'menu-panel-disabler';
  
  styleEl.textContent = `
    .mat-mdc-menu-panel, #mat-menu-panel-0, [id^="mat-menu-panel-"],
    [class*="menu-panel"], [id*="menu-panel"],
    [role="menu"], [aria-role="menu"],
    [class*="mat-"][class*="menu"], [class*="mdc-"][class*="menu"],
    [id*="mat-"][id*="menu"], [id*="mdc-"][id*="menu"] {
      width: 0 !important; 
      height: 0 !important; 
      min-width: 0 !important; 
      min-height: 0 !important;
      max-width: 0 !important; 
      max-height: 0 !important;
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      display: block !important;
      position: absolute !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0) !important;
      z-index: -9999 !important;
    }
  `;
  
  document.head.appendChild(styleEl);
  
  // Clean up old observer if exists
  if (observers.head) {
    observers.head.disconnect();
  }
  
  observers.head = new MutationObserver(() => {
    if (!document.getElementById('menu-panel-disabler')) {
      document.head.appendChild(styleEl.cloneNode(true));
    }
  });
  
  observers.head.observe(document.head, { childList: true });
  
  const intervalId = setInterval(() => {
    if (!document.getElementById('menu-panel-disabler')) {
      document.head.appendChild(styleEl.cloneNode(true));
    }
  }, CONFIG.styleCheckInterval);
  
  intervalIds.push(intervalId);
}

/**
 * Sets up text deselection behavior on kampus.sanomapro.fi
 */
function setupTextDeselection() {
  if (!isOnKampusDomain()) return;
  
  let isTextElementMouseDown = false;
  
  function isAllowedTextArea(element) {
    if (!element) return false;
    
    if (element.isContentEditable) return true;
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') return true;
    
    const classesToCheck = [
      'editor', 'text-area', 'textarea', 'text-editor', 'rich-text',
      'typing', 'input', 'editable', 'writeable', 'write', 'content-editable'
    ];
    
    const knownClasses = [
      'eb-content-block-mime-type-text-plain',
      'abitti-editor-container',
      'rich-text-editor'
    ];
    
    const checkElement = (el) => {
      if (!el || !el.classList) return false;
      
      for (const cls of knownClasses) {
        if (el.classList.contains(cls)) return true;
      }
      
      return Array.from(el.classList).some(className => {
        return classesToCheck.some(editClass => 
          className.toLowerCase().includes(editClass.toLowerCase())
        );
      });
    };
    
    if (checkElement(element)) return true;
    
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      if (checkElement(parent)) return true;
      parent = parent.parentElement;
      depth++;
    }
    
    if (element.getAttribute('role') === 'textbox') return true;
    if (element.getAttribute('contenteditable') === 'true') return true;
    
    return false;
  }
  
  const mousedownHandler = function(event) {
    const isTextContent = isAllowedTextArea(event.target);
    
    isTextElementMouseDown = isTextContent;
    
    if (!isTextContent) {
      window.getSelection().removeAllRanges();
    }
  };
  
  const mouseupHandler = function(event) {
    if (!isTextElementMouseDown && !isAllowedTextArea(event.target)) {
      window.getSelection().removeAllRanges();
    }
    isTextElementMouseDown = false;
  };
  
  const clickHandler = function(event) {
    const isTextContent = isAllowedTextArea(event.target);
    
    if (!isTextContent) {
      setTimeout(() => {
        window.getSelection().removeAllRanges();
      }, 0);
    }
  };
  
  document.addEventListener('mousedown', mousedownHandler, true);
  document.addEventListener('mouseup', mouseupHandler, true);
  document.addEventListener('click', clickHandler, true);
  
  // Store cleanup functions
  cleanupFunctions.push(() => {
    document.removeEventListener('mousedown', mousedownHandler, true);
    document.removeEventListener('mouseup', mouseupHandler, true);
    document.removeEventListener('click', clickHandler, true);
  });
}

/**
 * Sets up a mutation observer for MathJax elements
 */
function setupMathJaxObserver() {
  // Clean up old observer if exists
  if (observers.mathJax) {
    observers.mathJax.disconnect();
  }
  
  observers.mathJax = new MutationObserver((mutations) => {
    let mathJaxAdded = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'MJX-CONTAINER' || 
                node.classList?.contains('MathJax') || 
                node.querySelectorAll('mjx-container, .MathJax').length > 0) {
              mathJaxAdded = true;
              break;
            }
          }
        }
      }
    }
    
    if (mathJaxAdded) {
      setupMathJaxOverlay();
    }
  });
  
  observers.mathJax.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

/**
 * Cleanup function to remove all event listeners and observers
 */
function cleanup() {
  // Disconnect all observers
  if (observers.mathJax) {
    observers.mathJax.disconnect();
    observers.mathJax = null;
  }
  
  if (observers.head) {
    observers.head.disconnect();
    observers.head = null;
  }
  
  // Clear all intervals
  intervalIds.forEach(id => clearInterval(id));
  intervalIds = [];
  
  // Run all cleanup functions
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  
  // Clear cache
  conversionCache = {
    input: null,
    result: null
  };
}

/**
 * Initialize all functionality
 */
function initialize() {
  setupMathJaxOverlay();
  
  if (isOnKampusDomain()) {
    setupTextDeselection();
    permanentlyDisableMenuPanels();
  }
  
  setupMathJaxObserver();
}

// Run initialization when DOM is ready or now if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);
