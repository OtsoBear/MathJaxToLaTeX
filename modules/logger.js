/**
 * Logger module for MathML to LaTeX conversion with configurable levels
 */

class ConversionLogger {
  constructor() {
    // Default configuration - can be overridden
    this.config = {
      enabled: false, // Set to false in production
      levels: ['error', 'warning'], // Only log these levels in production
      verbose: false // Set to true for detailed debugging
    };
    
    this.conversionInProgress = false;
    this.loggedExpression = false;
  }

  /**
   * Configure the logger
   * @param {Object} config - Configuration object
   */
  configure(config) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Check if a log level should be output
   * @param {string} level - The log level to check
   * @returns {boolean} - Whether to output this level
   */
  shouldLog(level) {
    if (this.config.enabled) return true;
    return this.config.levels.includes(level);
  }

  // Log levels
  info(message) {
    if (this.shouldLog('info')) {
      console.log('[INFO]', message);
    }
  }

  debug(message, data) {
    if (this.shouldLog('debug') || this.config.verbose) {
      if (data !== undefined) {
        console.log('[DEBUG]', message, data);
      } else {
        console.log('[DEBUG]', message);
      }
    }
  }

  progress(message) {
    if (this.shouldLog('progress') && !this.conversionInProgress) {
      console.log('[PROGRESS]', message);
    }
  }

  success(message, data) {
    if (this.shouldLog('success')) {
      console.log('[SUCCESS]', message, data || '');
    }
  }

  error(message, error) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', message, error || '');
    }
  }

  warning(message) {
    if (this.shouldLog('warning')) {
      console.warn('[WARNING]', message);
    }
  }

  input(label, source) {
    if (this.shouldLog('input') && !this.loggedExpression) {
      console.log(`[INPUT] Math expression${source ? ` from ${source}` : ''}: "${label}"`);
      this.loggedExpression = true;
    }
  }

  startConversion(format) {
    this.conversionInProgress = true;
    this.loggedExpression = false;
    this.info(`Translating ${format} format...`);
  }

  endConversion(format) {
    this.info(`${format} to LaTeX conversion completed successfully`);
    this.conversionInProgress = false;
  }

  // Debug helpers
  debugNodeStructure(node, nodeType) {
    if (this.config.verbose) {
      this.debug(`${nodeType} node:`, {
        hasChildren: node && node.children ? node.children.length : 0,
        hasUseElement: node && node.querySelector ? !!node.querySelector('use') : false,
        innerHTML: node && node.innerHTML ? node.innerHTML.substring(0, 100) : 'no innerHTML'
      });
    }
  }

  debugExtractedContent(nodeType, content) {
    if (this.config.verbose) {
      this.debug(`${nodeType} extracted content:`, content);
    }
  }
}

// Create singleton instance
const logger = new ConversionLogger();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
} else {
  window.conversionLogger = logger;
}