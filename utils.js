/**
 * MathJaxToLaTeX - Utility Functions
 * 
 * This module provides utility functions to avoid code duplication
 * and prevent global prototype pollution
 */

/**
 * Safely parse HTML string using DOMParser
 * @param {string} htmlString - The HTML string to parse
 * @returns {HTMLElement} - The parsed element
 */
export function safeParseHTML(htmlString) {
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
export async function copyToClipboardWithFeedback(text, element, successMessage = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
    showCopiedFeedback(element);
    console.log(`[SUCCESS] ${successMessage}: ${text}`);
  } catch (err) {
    console.error('[ERROR] Failed to copy: ', err);
    throw err;
  }
}

/**
 * Shows feedback when content is copied
 * @param {HTMLElement} element - The element that was clicked to copy
 */
export function showCopiedFeedback(element) {
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
  }, 2000);
}

/**
 * Wrap event listener to handle text selection
 * @param {string} eventType - The event type
 * @param {Function} listener - The original listener
 * @param {Function} isAllowedTextArea - Function to check if element is allowed text area
 * @returns {Function} - Wrapped listener
 */
export function wrapEventListenerForTextSelection(eventType, listener, isAllowedTextArea) {
  if (['pointerup', 'pointerdown', 'mousedown', 'mouseup'].includes(eventType)) {
    return function wrappedListener(event) {
      const isTextContent = isAllowedTextArea(event.target);
      
      if (!isTextContent) {
        setTimeout(() => window.getSelection().removeAllRanges(), 0);
      }
      return listener.apply(this, arguments);
    };
  }
  return listener;
}

/**
 * Create and attach an event handler with automatic cleanup registration
 * @param {HTMLElement} element - Element to attach handler to
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Array} cleanupFunctions - Array to store cleanup functions
 * @param {boolean} useCapture - Whether to use capture phase
 */
export function attachEventWithCleanup(element, eventType, handler, cleanupFunctions, useCapture = false) {
  element.addEventListener(eventType, handler, useCapture);
  cleanupFunctions.push(() => {
    element.removeEventListener(eventType, handler, useCapture);
  });
}

/**
 * Create a MutationObserver with automatic cleanup
 * @param {Function} callback - Observer callback
 * @param {Node} target - Target node to observe
 * @param {Object} options - Observer options
 * @returns {MutationObserver} - The created observer
 */
export function createObserverWithCleanup(callback, target, options) {
  const observer = new MutationObserver(callback);
  observer.observe(target, options);
  return observer;
}

/**
 * Set an interval with automatic cleanup registration
 * @param {Function} callback - Interval callback
 * @param {number} delay - Interval delay
 * @param {Array} intervalIds - Array to store interval IDs
 * @returns {number} - The interval ID
 */
export function setIntervalWithCleanup(callback, delay, intervalIds) {
  const intervalId = setInterval(callback, delay);
  intervalIds.push(intervalId);
  return intervalId;
}