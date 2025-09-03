/**
 * MathJaxToLaTeX - Utility Functions
 *
 * This module provides utility functions to avoid code duplication
 * and prevent global prototype pollution
 */

(function() {
  'use strict';

  // Configuration constants
  const FEEDBACK_DURATION = 2000;

  /**
   * Safely parse HTML string using DOMParser with sanitization
   * @param {string} htmlString - The HTML string to parse
   * @returns {HTMLElement|null} - The parsed element or null if parsing fails
   */
  function safeParseHTML(htmlString) {
  try {
    // Basic sanitization - remove script tags and event handlers
    const sanitized = htmlString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
    
    // Check for parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('[ERROR] HTML parsing failed:', parseError.textContent);
      return null;
    }
    
    return doc.body.firstChild;
  } catch (error) {
    console.error('[ERROR] Failed to parse HTML:', error);
    return null;
  }
}

/**
 * Copy text to clipboard with feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} element - Element to show feedback near
 * @param {string} successMessage - Success log message
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function copyToClipboardWithFeedback(text, element, successMessage = 'Copied to clipboard') {
  try {
    // Remove trailing single "." if it exists
    let cleanedText = text;
    if (cleanedText.endsWith('.') && !cleanedText.endsWith('..') && !cleanedText.endsWith('\\ldots')) {
      cleanedText = cleanedText.slice(0, -1);
    }
    
    await navigator.clipboard.writeText(cleanedText);
    showCopiedFeedback(element);
    
    // Use configured logger if available
    if (window.conversionLogger && window.conversionLogger.success) {
      window.conversionLogger.success(successMessage, cleanedText);
    }
    
    return true;
  } catch (err) {
    if (window.conversionLogger && window.conversionLogger.error) {
      window.conversionLogger.error('Failed to copy to clipboard', err);
    }
    return false;
  }
}

/**
 * Shows feedback when content is copied
 * @param {HTMLElement} element - The element that was clicked to copy
 */
function showCopiedFeedback(element) {
  if (!element) return;
  
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
    animation: fade-out ${FEEDBACK_DURATION}ms forwards;
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
  }, FEEDBACK_DURATION);
}

/**
 * Create and attach an event handler with automatic cleanup registration
 * @param {HTMLElement} element - Element to attach handler to
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Array} cleanupFunctions - Array to store cleanup functions
 * @param {boolean} useCapture - Whether to use capture phase
 */
function attachEventWithCleanup(element, eventType, handler, cleanupFunctions, useCapture = false) {
  if (!element || !handler) return;
  
  element.addEventListener(eventType, handler, useCapture);
  
  // Prevent unbounded growth of cleanup functions array
  const MAX_CLEANUP_FUNCTIONS = 100;
  if (cleanupFunctions && cleanupFunctions.length >= MAX_CLEANUP_FUNCTIONS) {
    // Execute and remove oldest cleanup functions
    const toRemove = cleanupFunctions.splice(0, 10);
    toRemove.forEach(fn => {
      try {
        fn();
      } catch (e) {
        // Ignore errors from old cleanup functions
      }
    });
  }
  
  if (cleanupFunctions) {
    cleanupFunctions.push(() => {
      element.removeEventListener(eventType, handler, useCapture);
    });
  }
}

/**
 * Create a MutationObserver with automatic cleanup
 * @param {Function} callback - Observer callback
 * @param {Node} target - Target node to observe
 * @param {Object} options - Observer options
 * @returns {MutationObserver|null} - The created observer or null if creation fails
 */
function createObserverWithCleanup(callback, target, options) {
  if (!callback || !target) return null;
  
  try {
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
    return observer;
  } catch (error) {
    console.error('[ERROR] Failed to create MutationObserver:', error);
    return null;
  }
}

/**
 * Set an interval with automatic cleanup registration
 * @param {Function} callback - Interval callback
 * @param {number} delay - Interval delay
 * @param {Array} intervalIds - Array to store interval IDs
 * @returns {number|null} - The interval ID or null if creation fails
 */
function setIntervalWithCleanup(callback, delay, intervalIds) {
  if (!callback || !intervalIds) return null;
  
  const intervalId = setInterval(callback, delay);
  intervalIds.push(intervalId);
  return intervalId;
}

/**
 * Debounce function to limit execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

  // Export for both browser and Node.js environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      safeParseHTML,
      copyToClipboardWithFeedback,
      showCopiedFeedback,
      attachEventWithCleanup,
      createObserverWithCleanup,
      setIntervalWithCleanup,
      debounce,
      throttle
    };
  } else if (typeof window !== 'undefined') {
    window.extensionUtils = {
      safeParseHTML,
      copyToClipboardWithFeedback,
      showCopiedFeedback,
      attachEventWithCleanup,
      createObserverWithCleanup,
      setIntervalWithCleanup,
      debounce,
      throttle
    };
  }
})();