/**
 * Logger module for MathML to LaTeX conversion
 */

class ConversionLogger {
  constructor() {
    this.enabled = true;
    this.conversionInProgress = false;
    this.loggedExpression = false;
  }

  // Log levels
  info(message) {
    if (this.enabled) console.log('[INFO]', message);
  }

  debug(message, data) {
    if (this.enabled) {
      if (data !== undefined) {
        console.log('[DEBUG]', message, data);
      } else {
        console.log('[DEBUG]', message);
      }
    }
  }

  progress(message) {
    if (this.enabled && !this.conversionInProgress) {
      console.log('[PROGRESS]', message);
    }
  }

  success(message, data) {
    if (this.enabled) console.log('[SUCCESS]', message, data || '');
  }

  error(message, error) {
    console.error('[ERROR]', message, error || '');
  }

  warning(message) {
    console.log('[WARNING]', message);
  }

  input(label, source) {
    if (!this.loggedExpression) {
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
    this.debug(`${nodeType} node:`, {
      hasChildren: node.children ? node.children.length : 0,
      hasUseElement: node.querySelector ? !!node.querySelector('use') : false,
      innerHTML: node.innerHTML ? node.innerHTML.substring(0, 100) : 'no innerHTML'
    });
  }

  debugExtractedContent(nodeType, content) {
    this.debug(`${nodeType} extracted content:`, content);
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