/**
 * Centralized configuration settings for MathJax to LaTeX Extension
 * 
 * This file contains all configuration constants and settings
 * to avoid magic numbers and strings throughout the codebase
 */

const ExtensionConfig = {
  // Display settings
  feedback: {
    duration: 2000, // Duration to show "Copied!" feedback in milliseconds
    animationName: 'fade-out',
    styles: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000
    }
  },

  // Performance settings
  performance: {
    mutationObserverDelay: 100, // Debounce delay for mutation observer in ms
    styleCheckInterval: 5000,   // Interval to check if style elements are still in place
    maxSearchDepth: 5,          // Maximum depth to search for parent elements
    cacheEnabled: true          // Enable/disable conversion caching
  },

  // Domain-specific settings
  domains: {
    kampus: {
      hostname: 'kampus.sanomapro.fi',
      features: {
        disableMenuPanels: true,     // Disable menu panels
        manageTextSelection: true    // Manage text selection behavior
      }
    }
  },

  // Logging configuration
  logging: {
    enabled: false,              // Set to false in production
    levels: ['error', 'warning'], // Log levels to output in production
    verbose: false,              // Verbose debugging output
    maxLogLength: 200           // Maximum length for debug log output
  },

  // Text processing
  text: {
    normalizeNonBreakingSpaces: true, // Convert non-breaking spaces to regular spaces
    removeSingleTrailingPeriod: true  // Remove single trailing period from equations
  },

  // Math processing
  math: {
    supportedRootIndices: /^[2-9]$/, // Regex for valid root indices
    defaultRootIndex: '2',            // Default root index if not specified
    wrapTextInCommand: true           // Wrap text content in \text{} command
  },

  // Element selectors
  selectors: {
    mathJaxContainers: 'mjx-container.MathJax:not(.mathjax-copyable)',
    mathGElements: 'g[data-mml-node="math"]',
    assistiveMML: 'mjx-assistive-mml math',
    chtmlMath: 'mjx-math',
    menuPanels: [
      '.mat-mdc-menu-panel',
      '#mat-menu-panel-0',
      '[id^="mat-menu-panel-"]',
      '[class*="menu-panel"]',
      '[id*="menu-panel"]',
      '[role="menu"]',
      '[aria-role="menu"]',
      '[class*="mat-"][class*="menu"]',
      '[class*="mdc-"][class*="menu"]',
      '[id*="mat-"][id*="menu"]',
      '[id*="mdc-"][id*="menu"]'
    ].join(', ')
  },

  // Editable element detection
  editableElements: {
    tags: ['INPUT', 'TEXTAREA'],
    attributes: {
      contentEditable: 'true',
      role: 'textbox'
    },
    classPatterns: [
      'editor', 'text-area', 'textarea', 'text-editor', 'rich-text',
      'typing', 'input', 'editable', 'writeable', 'write', 'content-editable'
    ],
    knownClasses: [
      'eb-content-block-mime-type-text-plain',
      'abitti-editor-container',
      'rich-text-editor'
    ]
  },

  // File size limits
  limits: {
    maxFunctionLength: 50,     // Maximum lines for a single function
    maxFileLength: 500,        // Maximum lines for a single file
    maxCyclomaticComplexity: 10 // Maximum cyclomatic complexity
  },

  // Extension metadata
  metadata: {
    name: 'MathJax to LaTeX',
    version: '2.0.0',
    author: 'Extension Team',
    description: 'Convert MathJax equations to LaTeX format'
  }
};

// Freeze the configuration to prevent accidental modifications
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null
        && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
        && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
}

// Export frozen configuration
const FrozenConfig = deepFreeze(ExtensionConfig);

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrozenConfig;
} else if (typeof window !== 'undefined') {
  window.ExtensionConfig = FrozenConfig;
}