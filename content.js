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
  domainSpecific: {
    kampus: 'kampus.sanomapro.fi'
  }
};

// Cache for storing previous conversions
let conversionCache = {
  input: null,
  result: null
};

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
    // Parse the MathML input
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mathmlInput;
    
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
  const mathJaxElements = document.querySelectorAll('mjx-container.MathJax');
  
  mathJaxElements.forEach(element => {
    element.classList.add('mathjax-copyable');
    
    element.addEventListener('click', function(event) {
      // Get the aria-label for user feedback
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        console.log('[INFO] Clicked math expression: "' + ariaLabel + '"');
      }
      
      const mathElements = element.querySelectorAll('g[data-mml-node="math"]');
      
      if (mathElements.length > 0) {
        let htmlContent = '';
        mathElements.forEach(math => {
          htmlContent += math.outerHTML;
        });
        
        if (htmlContent) {
          const latexContent = convertToLatex(htmlContent);
          navigator.clipboard.writeText(latexContent)
            .then(() => {
              showCopiedFeedback(element);
              console.log('[SUCCESS] Copied to clipboard: ' + latexContent);
            })
            .catch(err => {
              console.error('[ERROR] Failed to copy HTML: ', err);
            });
        }
      } else {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          navigator.clipboard.writeText(ariaLabel)
            .then(() => {
              showCopiedFeedback(element);
              console.log('[INFO] Copied aria-label to clipboard');
            })
            .catch(err => {
              console.error('[ERROR] Failed to copy text: ', err);
            });
        }
      }
      
      event.preventDefault();
      event.stopPropagation();
    });
  });
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
 * Shows feedback when content is copied
 * @param {HTMLElement} element - The element that was clicked to copy
 */
function showCopiedFeedback(element) {
  const feedback = document.createElement('div');
  feedback.textContent = 'Copied!';
  feedback.className = 'mathjax-copy-feedback';
  
  // Position near the element
  const rect = element.getBoundingClientRect();
  feedback.style.top = `${rect.top + window.scrollY - 30}px`;
  feedback.style.left = `${rect.left + window.scrollX}px`;
  
  // Style the feedback element
  feedback.style.position = 'absolute';
  feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  feedback.style.color = 'white';
  feedback.style.padding = '5px 10px';
  feedback.style.borderRadius = '4px';
  feedback.style.pointerEvents = 'none';
  feedback.style.zIndex = '10000';
  feedback.style.animation = 'fade-out 2s forwards';
  
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
      .mathjax-copy-feedback {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
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
  
  const headObserver = new MutationObserver(() => {
    if (!document.getElementById('menu-panel-disabler')) {
      document.head.appendChild(styleEl.cloneNode(true));
    }
  });
  
  headObserver.observe(document.head, { childList: true });
  
  setInterval(() => {
    if (!document.getElementById('menu-panel-disabler')) {
      document.head.appendChild(styleEl.cloneNode(true));
    }
  }, CONFIG.styleCheckInterval);
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
  
  document.addEventListener('mousedown', function(event) {
    const isTextContent = isAllowedTextArea(event.target);
    
    isTextElementMouseDown = isTextContent;
    
    if (!isTextContent) {
      window.getSelection().removeAllRanges();
    }
  }, true);
  
  document.addEventListener('mouseup', function(event) {
    if (!isTextElementMouseDown && !isAllowedTextArea(event.target)) {
      window.getSelection().removeAllRanges();
    }
    isTextElementMouseDown = false;
  }, true);
  
  document.addEventListener('click', function(event) {
    const isTextContent = isAllowedTextArea(event.target);
    
    if (!isTextContent) {
      setTimeout(() => {
        window.getSelection().removeAllRanges();
      }, 0);
    }
  }, true);
  
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'pointerup' || type === 'pointerdown' || type === 'mousedown' || type === 'mouseup') {
      const wrappedListener = function(event) {
        const isTextContent = isAllowedTextArea(event.target);
        
        if (!isTextContent) {
          setTimeout(() => window.getSelection().removeAllRanges(), 0);
        }
        return listener.apply(this, arguments);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

/**
 * Sets up a mutation observer for MathJax elements
 */
function setupMathJaxObserver() {
  const mathJaxObserver = new MutationObserver((mutations) => {
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
  
  mathJaxObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
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
