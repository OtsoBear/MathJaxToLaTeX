/**
 * MathJaxToLaTeX - Content Script
 *
 * This script provides functionality for:
 * 1. Converting MathJax elements to LaTeX
 * 2. Enabling copy functionality for MathJax elements
 * 3. Disabling unwanted menu panels on kampus.sanomapro.fi
 * 4. Managing text selection behavior on kampus.sanomapro.fi
 */

// Configuration
const CONFIG = {
  copiedFeedbackDuration: 2000, // Duration to show "Copied!" feedback in ms
  styleCheckInterval: 5000,     // Interval to check if style elements are still in place
  mutationObserverDelay: 100,   // Debounce delay for mutation observer
  domainSpecific: {
    kampus: 'kampus.sanomapro.fi'
  },
  // Feature toggles for kampus.sanomapro.fi specific functionality
  kampusFeatures: {
    disableMenuPanels: true,     // Set to true to disable menu panels on kampus.sanomapro.fi
    manageTextSelection: true    // Set to true to manage text selection behavior on kampus.sanomapro.fi
  },
  // Logging configuration
  logging: {
    enabled: false,  // Set to false in production
    levels: ['error', 'warning'] // Only log these levels in production
  }
};

// Get utilities from global scope (loaded from utils.js)
const utils = window.extensionUtils || {};
const {
  safeParseHTML,
  copyToClipboardWithFeedback,
  showCopiedFeedback,
  attachEventWithCleanup,
  createObserverWithCleanup,
  setIntervalWithCleanup,
  debounce,
  throttle
} = utils;

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
 * Converts MathML to LaTeX format with error handling
 * @param {string} mathmlInput - The MathML input to convert
 * @returns {string} - The converted LaTeX string
 */
function convertToLatex(mathmlInput) {
  try {
    // Validate input
    if (!mathmlInput || typeof mathmlInput !== 'string') {
      logError('Invalid MathML input');
      return "Invalid input provided";
    }
    
    // Use cache if input hasn't changed
    if (mathmlInput === conversionCache.input && conversionCache.result !== null) {
      logDebug('Using cached LaTeX result');
      return conversionCache.result;
    }
    
    // Parse the MathML input safely
    const tempDiv = safeParseHTML(mathmlInput);
    if (!tempDiv) {
      logError('Failed to parse MathML input');
      return "Failed to parse MathML";
    }
    
    // Find the math node
    const mathNode = tempDiv.querySelector('[data-mml-node="math"]');
    if (!mathNode) {
      logWarning('No valid MathML found in input');
      return "No valid MathML found";
    }
    
    logDebug('Starting LaTeX conversion');
    
    // Convert to LaTeX using the function from translate.js
    if (typeof convertMathMLToLatex !== 'function') {
      logError('convertMathMLToLatex function not available');
      return "Conversion function not available";
    }
    
    const latex = convertMathMLToLatex(mathNode);
    
    // Validate result
    if (!latex || typeof latex !== 'string') {
      logError('Invalid conversion result');
      return "Conversion failed";
    }
    
    // Cache the result
    conversionCache.input = mathmlInput;
    conversionCache.result = latex;
    
    return latex;
  } catch (error) {
    logError('LaTeX Conversion Failed', error);
    return `Error: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Logging utilities with configuration support
 */
function logDebug(message, data) {
  if (CONFIG.logging.enabled || CONFIG.logging.levels.includes('debug')) {
    console.log('[DEBUG]', message, data || '');
  }
}

function logInfo(message) {
  if (CONFIG.logging.enabled || CONFIG.logging.levels.includes('info')) {
    console.log('[INFO]', message);
  }
}

function logWarning(message) {
  if (CONFIG.logging.enabled || CONFIG.logging.levels.includes('warning')) {
    console.warn('[WARNING]', message);
  }
}

function logError(message, error) {
  if (CONFIG.logging.enabled || CONFIG.logging.levels.includes('error')) {
    console.error('[ERROR]', message, error || '');
  }
}

/**
 * Sets up overlay functionality for MathJax elements with error handling
 */
function setupMathJaxOverlay() {
  try {
    // Find both standard MathJax containers and g elements with data-mml-node="math"
    const mathJaxContainers = document.querySelectorAll('mjx-container.MathJax:not(.mathjax-copyable)');
    const mathGElements = document.querySelectorAll('g[data-mml-node="math"]');
  
    // Process standard MathJax containers
    mathJaxContainers.forEach(element => {
      try {
        element.classList.add('mathjax-copyable');
        
        const clickHandler = function(event) {
          try {
            // Get the aria-label for user feedback
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) {
              logDebug('Clicked math expression: "' + ariaLabel + '"');
            }
      
            // Check if this is CHTML or SVG format
            const jaxType = element.getAttribute('jax') || '';
            
            if (jaxType.toUpperCase() === 'CHTML') {
              // Handle CHTML format
              logDebug('Processing CHTML format MathJax');
        
              // Option 1: If assistive MathML is available, we can use it directly
              const assistiveMML = element.querySelector('mjx-assistive-mml math');
              if (assistiveMML) {
                logDebug('Using assistive MathML for conversion');
          
                try {
                  // Use the specialized assistive MathML processor directly here
                  if (typeof convertMathMLFromAssistiveMML === 'function') {
                    const latexContent = convertMathMLFromAssistiveMML(assistiveMML);
                    logDebug('Generated LaTeX:', latexContent);
                    
                    copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard');
                  } else {
                    throw new Error('convertMathMLFromAssistiveMML not available');
                  }
                } catch (error) {
                  logError('Error converting assistive MathML', error);
            
                  // Fallback: try direct MathML from assistive-mml
                  try {
                    const mathML = assistiveMML.outerHTML;
                    const tempDiv = safeParseHTML(mathML);
                    
                    if (tempDiv) {
                      // Try fallback direct processing
                      const latexContent = processAssistiveMathML(tempDiv.querySelector('math'));
                      logDebug('Fallback LaTeX:', latexContent);
                      
                      copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard (fallback)');
                    } else {
                      copyAriaLabelAsText(element);
                    }
                  } catch (fallbackError) {
                    logError('Fallback conversion also failed', fallbackError);
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
                logDebug('Using CHTML structure for conversion');
                if (typeof convertMathMLToLatex === 'function') {
                  const latexContent = convertMathMLToLatex(element);
                  copyToClipboardWithFeedback(latexContent, element, 'Copied to clipboard');
                }
                
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
          } catch (error) {
            logError('Error in click handler', error);
          }
        };
        
        attachEventWithCleanup(element, 'click', clickHandler, cleanupFunctions);
      } catch (error) {
        logError('Error processing MathJax container', error);
      }
    });
  
    // Process g elements with data-mml-node="math"
    mathGElements.forEach(element => {
      try {
        // Skip if already inside a processed mjx-container
        if (element.closest('mjx-container.mathjax-copyable')) {
          return;
        }
        
        // Find closest parent that can be made clickable (SVG or containing div)
        const clickableParent = element.closest('svg') || element.parentElement;
        if (!clickableParent) return;
        
        clickableParent.classList.add('mathjax-copyable');
        
        const clickHandler = function(event) {
          try {
            // Use the math element directly
            const htmlContent = element.outerHTML;
            
            if (htmlContent) {
              const latexContent = convertToLatex(htmlContent);
              copyToClipboardWithFeedback(latexContent, clickableParent, 'Copied to clipboard');
            }
            
            event.preventDefault();
            event.stopPropagation();
          } catch (error) {
            logError('Error in g element click handler', error);
          }
        };
        
        attachEventWithCleanup(clickableParent, 'click', clickHandler, cleanupFunctions);
      } catch (error) {
        logError('Error processing g element', error);
      }
    });
  } catch (error) {
    logError('Error in setupMathJaxOverlay', error);
  }
}

/**
 * Direct assistive MathML parsing as fallback with error handling
 */
function processAssistiveMathML(mathNode) {
  try {
    if (!mathNode) return 'No math node found';
    
    // Process direct MathML - simpler approach focused on key structures
    function processMathNode(node) {
      if (!node) return '';
      
      try {
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
      } catch (error) {
        logError('Error processing MathML node', error);
        return '';
      }
    }
    
    return processMathNode(mathNode);
  } catch (error) {
    logError('Error in processAssistiveMathML', error);
    return 'Error processing MathML';
  }
}

/**
 * Fallback to just copying the aria-label text
 */
function copyAriaLabelAsText(element) {
  try {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      copyToClipboardWithFeedback(ariaLabel, element, 'Copied aria-label to clipboard as fallback');
    } else {
      logWarning('No aria-label found for fallback');
    }
  } catch (error) {
    logError('Error copying aria-label', error);
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

/**
 * Disables menu panels on kampus.sanomapro.fi using permanent CSS injection
 */
function permanentlyDisableMenuPanels() {
  try {
    if (!isOnKampusDomain() || !CONFIG.kampusFeatures.disableMenuPanels) return;
    
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
    
    const observerCallback = () => {
      if (!document.getElementById('menu-panel-disabler')) {
        document.head.appendChild(styleEl.cloneNode(true));
      }
    };
    
    observers.head = createObserverWithCleanup(
      observerCallback,
      document.head,
      { childList: true }
    );
    
    setIntervalWithCleanup(() => {
      if (!document.getElementById('menu-panel-disabler')) {
        document.head.appendChild(styleEl.cloneNode(true));
      }
    }, CONFIG.styleCheckInterval, intervalIds);
    
    logDebug('Menu panel disabler installed');
  } catch (error) {
    logError('Error disabling menu panels', error);
  }
}

/**
 * Sets up text deselection behavior on kampus.sanomapro.fi with error handling
 */
function setupTextDeselection() {
  try {
    if (!isOnKampusDomain() || !CONFIG.kampusFeatures.manageTextSelection) return;
    
    logDebug('Setting up text deselection behavior for kampus.sanomapro.fi');
    
    let isTextElementMouseDown = false;
  
    function isAllowedTextArea(element) {
      if (!element) return false;
      
      try {
        if (element.isContentEditable) {
          logDebug('Element is contentEditable:', element);
          return true;
        }
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          logDebug('Element is INPUT or TEXTAREA:', element.tagName);
          return true;
        }
    
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
            if (el.classList.contains(cls)) {
              logDebug('Found known editable class:', cls);
              return true;
            }
          }
          
          const found = Array.from(el.classList).some(className => {
            return classesToCheck.some(editClass => {
              if (className.toLowerCase().includes(editClass.toLowerCase())) {
                logDebug('Found editable class pattern:', className + ' matches ' + editClass);
                return true;
              }
              return false;
            });
          });
          
          return found;
        };
    
        if (checkElement(element)) {
          logDebug('Element identified as allowed text area');
          return true;
        }
        
        let parent = element.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          if (checkElement(parent)) return true;
          parent = parent.parentElement;
          depth++;
        }
        
        if (element.getAttribute('role') === 'textbox') {
          logDebug('Element has role="textbox"');
          return true;
        }
        if (element.getAttribute('contenteditable') === 'true') {
          logDebug('Element has contenteditable="true"');
          return true;
        }
        
        return false;
      } catch (error) {
        logError('Error checking if element is allowed text area', error);
        return false;
      }
    }
  
    const mousedownHandler = function(event) {
      try {
        // Skip right-click (button 2) to allow context menu on selected text
        if (event.button === 2) {
          logDebug('Right-click detected, preserving text selection for context menu');
          return;
        }
        
        const isTextContent = isAllowedTextArea(event.target);
        isTextElementMouseDown = isTextContent;
        
        if (!isTextContent) {
          window.getSelection().removeAllRanges();
        }
      } catch (error) {
        logError('Error in mousedown handler', error);
      }
    };
  
    const mouseupHandler = function(event) {
      try {
        // Skip right-click (button 2) to allow context menu on selected text
        if (event.button === 2) {
          return;
        }
        
        const isTargetTextArea = isAllowedTextArea(event.target);
        
        if (!isTextElementMouseDown && !isTargetTextArea) {
          window.getSelection().removeAllRanges();
        }
        isTextElementMouseDown = false;
      } catch (error) {
        logError('Error in mouseup handler', error);
      }
    };
  
    const clickHandler = function(event) {
      try {
        // Skip right-click (button 2) to allow context menu on selected text
        if (event.button === 2) {
          return;
        }
        
        const isTextContent = isAllowedTextArea(event.target);
        
        if (!isTextContent) {
          setTimeout(() => {
            window.getSelection().removeAllRanges();
          }, 0);
        }
      } catch (error) {
        logError('Error in click handler', error);
      }
    };
    
    // Add contextmenu handler to ensure right-click context menu works
    const contextMenuHandler = function(event) {
      // Don't interfere with the context menu
      // The browser will handle it naturally
    };
    
    // Use false for useCapture to allow normal event flow for right-clicks
    attachEventWithCleanup(document, 'mousedown', mousedownHandler, cleanupFunctions, false);
    attachEventWithCleanup(document, 'mouseup', mouseupHandler, cleanupFunctions, false);
    attachEventWithCleanup(document, 'click', clickHandler, cleanupFunctions, false);
    attachEventWithCleanup(document, 'contextmenu', contextMenuHandler, cleanupFunctions, false);
    
    logDebug('Text deselection event handlers attached');
  } catch (error) {
    logError('Error setting up text deselection', error);
  }
}

/**
 * Sets up a mutation observer for MathJax elements with debouncing
 */
function setupMathJaxObserver() {
  try {
    // Clean up old observer if exists
    if (observers.mathJax) {
      observers.mathJax.disconnect();
    }
    
    // Debounced setup function to avoid excessive calls
    const debouncedSetup = debounce(() => {
      setupMathJaxOverlay();
    }, CONFIG.mutationObserverDelay);
    
    const observerCallback = (mutations) => {
      try {
        let mathJaxAdded = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'MJX-CONTAINER' ||
                    node.classList?.contains('MathJax') ||
                    (node.querySelectorAll && node.querySelectorAll('mjx-container, .MathJax').length > 0)) {
                  mathJaxAdded = true;
                  break;
                }
              }
            }
          }
          if (mathJaxAdded) break;
        }
        
        if (mathJaxAdded) {
          debouncedSetup();
        }
      } catch (error) {
        logError('Error in MathJax observer callback', error);
      }
    };
    
    observers.mathJax = createObserverWithCleanup(
      observerCallback,
      document.body,
      {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      }
    );
  } catch (error) {
    logError('Error setting up MathJax observer', error);
  }
}

/**
 * Cleanup function to remove all event listeners and observers
 */
function cleanup() {
  try {
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
    intervalIds.forEach(id => {
      try {
        clearInterval(id);
      } catch (e) {
        // Ignore errors when clearing intervals
      }
    });
    intervalIds = [];
    
    // Run all cleanup functions
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (e) {
        logError('Error running cleanup function', e);
      }
    });
    cleanupFunctions = [];
    
    // Clear cache
    conversionCache = {
      input: null,
      result: null
    };
    
    logDebug('Cleanup completed');
  } catch (error) {
    logError('Error during cleanup', error);
  }
}

/**
 * Initialize all functionality with error handling
 */
function initialize() {
  try {
    logInfo('Initializing MathJax to LaTeX extension');
    
    setupMathJaxOverlay();
    
    if (isOnKampusDomain()) {
      // Only run kampus-specific features if enabled in CONFIG
      if (CONFIG.kampusFeatures.manageTextSelection) {
        setupTextDeselection();
        logInfo('Text selection management enabled for kampus.sanomapro.fi');
      }
      if (CONFIG.kampusFeatures.disableMenuPanels) {
        permanentlyDisableMenuPanels();
        logInfo('Menu panel disabling enabled for kampus.sanomapro.fi');
      }
    }
    
    setupMathJaxObserver();
    
    logInfo('Extension initialized successfully');
  } catch (error) {
    logError('Error during initialization', error);
  }
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

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initialize,
    cleanup,
    setupMathJaxOverlay,
    convertToLatex
  };
}
