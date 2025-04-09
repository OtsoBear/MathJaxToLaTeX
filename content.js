// Cache for storing previous conversions
let lastInput = null;
let lastResult = null;

// Function to create an overlay on MathJax elements
function convertToLatex(mathmlInput) {
    // Check if this is the same as the last input
    if (mathmlInput === lastInput && lastResult !== null) {
        console.log('Using cached result - same input as last time');
        return lastResult;
    }
        
    try {
        // Create a temporary div to hold the parsed MathML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = mathmlInput;
        console.log('PARSED HTML:', tempDiv.innerHTML);
        
        // Get the MathML node
        const mathNode = tempDiv.querySelector('[data-mml-node="math"]');
        console.log('Found math node:', mathNode ? 'Yes' : 'No');
        
        if (!mathNode) {
            return "No valid MathML found!";
        }
        
        
        // Convert the MathML node to LaTeX - using the function from translate.js
        console.log('Starting conversion to LaTeX');
        const latex = convertMathMLToLatex(mathNode);
        console.log('FINAL LATEX:', latex);
        
        // Cache the result
        lastInput = mathmlInput;
        lastResult = latex;
        
        // Return the result
        return latex;
    } catch (error) {
        console.error('CONVERSION ERROR:', error);
        return "Error converting MathML: " + error.message;
    }
}


function setupMathJaxOverlay() {
  // Find all MathJax elements
  const mathJaxElements = document.querySelectorAll('mjx-container.MathJax');
  
  mathJaxElements.forEach(element => {
    // Add a class for styling
    element.classList.add('mathjax-copyable');
    
    // Add click event listener
    element.addEventListener('click', function(event) {
      // Look for all g elements with data-mml-node="math" attribute
      const mathElements = element.querySelectorAll('g[data-mml-node="math"]');
      
      if (mathElements.length > 0) {
        // Collect the HTML content from all math elements
        let htmlContent = '';
        mathElements.forEach(math => {
          htmlContent += math.outerHTML;
        });
        
        if (htmlContent) {
          // Copy to clipboard
          latexContent = convertToLatex(htmlContent);
          navigator.clipboard.writeText(latexContent)
            .then(() => {
              // Show feedback
              showCopiedFeedback(element);
            })
            .catch(err => {
              console.error('Failed to copy HTML: ', err);
            });
        }
      } else {
        // Fallback to copying aria-label if no math elements found
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          navigator.clipboard.writeText(ariaLabel)
            .then(() => {
              showCopiedFeedback(element);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
            });
        }
      }
      
      // Prevent any default behavior or propagation
      event.preventDefault();
      event.stopPropagation();
    });
  });
}

// Function to show feedback when text is copied
function showCopiedFeedback(element) {
  // Create a feedback element
  const feedback = document.createElement('div');
  feedback.textContent = 'Copied!';
  feedback.className = 'mathjax-copy-feedback';
  
  // Position it near the element
  const rect = element.getBoundingClientRect();
  feedback.style.top = `${rect.top + window.scrollY - 30}px`;
  feedback.style.left = `${rect.left + window.scrollX}px`;
  
  // Append to body
  document.body.appendChild(feedback);
  
  // Remove after animation
  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// Run setup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupMathJaxOverlay);

// Also run setup now in case the DOM is already loaded
setupMathJaxOverlay();

// Set up a mutation observer to detect dynamically added MathJax elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      setupMathJaxOverlay();
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});
