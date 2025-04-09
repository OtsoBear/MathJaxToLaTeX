
// Test cases for MathJax to LaTeX translator
const testCases = [
    {
        ariaLabel: "A equals 2 pi the integral from 0 to 1 of the absolute value of f of x times the square root of 1 plus f prime x squared d x",
        expectedLatex: "A=2\\pi \\int _0^1\\left|f\\left(x\\right)\\right|\\sqrt{1+f'\\left(x\\right)^2}dx"
    },
    {
        ariaLabel: "V equals one third pi r squared h",
        expectedLatex: "V=\\frac{1}{3}\\pi r^2h"
    },
    {
        ariaLabel: "the integral from 0 to pi of open paren 1 plus the sine of x over 2 close paren d x",
        expectedLatex: "\\int _0^{\\pi }\\left(1+\\sin \\frac{x}{2}\\right)dx"
    },
    {
        ariaLabel: "f of x equals cosine x minus sine x",
        expectedLatex: "f\\left(x\\right)=\\cos x-\\sin x"
    },
    {
        ariaLabel: "the integral from 0 to 4 of f of x d x plus the integral from 6 to 10 of f of x d x",
        expectedLatex: "\\int _0^4f\\left(x\\right)dx+\\int _6^{10}f\\left(x\\right)dx"
    },
    {
        ariaLabel: "g of x equals the fifth root of the fraction with numerator the square root of x and denominator x squared minus 4",
        expectedLatex: "g\\left(x\\right)=\\sqrt[5]{\\frac{\\sqrt{x}}{x^2-4}}"
    },
    {
        ariaLabel: "f of x equals the fraction with numerator 4 and denominator the fourth root of x squared plus x minus 6 minus the square root of x squared minus 1",
        expectedLatex: "f\\left(x\\right)=\\frac{4}{\\sqrt[4]{x^2+x-6}}-\\sqrt{x^2-1}"
    },
    {
        ariaLabel: "a x en dash 1 is greater than 2 a en dash x",
        expectedLatex: "ax-1>2a-x"
    },
    {
        ariaLabel: "a x is greater than or equal to 4",
        expectedLatex: "ax\\ge 4"
    },
    {
        ariaLabel: "open paren 1 plus the fraction with numerator 1 and denominator x plus 1 close paren times open paren x minus 1 over x close paren",
        expectedLatex: "\\left(1+\\frac{1}{x+1}\\right)\\cdot \\left(x-\\frac{1}{x}\\right)"
    },
    {
        ariaLabel: "f of x equals the fraction with numerator log base 10 2 x and denominator x squared",
        expectedLatex: "f\\left(x\\right)=\\frac{\\lg 2x}{x^2}"
    },
    {
        ariaLabel: "f of x equals e to the x-th power minus a times the absolute value of x minus 1",
        expectedLatex: "f\\left(x\\right)=e^x-a\\left|x-1\\right|"
    },
    {
        ariaLabel: "f of x equals sine squared x the fourth power of cosine x comma x is a member of R",
        expectedLatex: "f\\left(x\\right)=\\sin ^2x\\cos ^4x{,}\\ \\ x\\in \\mathbb{R}"
    },
    {
        ariaLabel: "open bracket 0 comma 3 close bracket",
        expectedLatex: "\\left[0{,}\\ 3\\right]"
    },
    {
        ariaLabel: "the absolute value of 2 a bar minus 5 b bar",
        expectedLatex: "\\left|2\\bar{a}\\ -5\\bar{b}\\right|"
    },
    {
        ariaLabel: "a bar times b bar equals 5",
        expectedLatex: "\\bar{a}\\cdot \\bar{b}=5"
    },
    {
        ariaLabel: "the line segment X A equals negative the line segment O B",
        expectedLatex: "\\bar{XA}=-\\bar{OB}"
    },
    {
        ariaLabel: "open paren 5 plus 24 over 60 plus the fraction with numerator 72 and denominator 60 times 60 close paren degrees equals 5 comma 42 degrees",
        expectedLatex: "\\left(5+\\frac{24}{60}+\\frac{72}{60\\cdot 60}\\right)°=5{,}42°"
    }
];

// Function to run the tests
function runTests() {
    const results = {
        passed: 0,
        failed: 0,
        details: []
    };

    testCases.forEach((testCase, index) => {
        const actualLatex = translateAriaToLatex(testCase.ariaLabel);
        const passed = actualLatex === testCase.expectedLatex;
        
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        results.details.push({
            testNumber: index + 1,
            ariaLabel: testCase.ariaLabel,
            expectedLatex: testCase.expectedLatex,
            actualLatex: actualLatex,
            passed: passed
        });
    });
    
    return results;
}

// Format and display test results
function displayTestResults(results) {
    console.log(`Tests Summary: ${results.passed} passed, ${results.failed} failed`);
    
    const resultsContainer = document.getElementById('test-results');
    if (!resultsContainer) return;
    
    let html = `<h2>Test Results: ${results.passed} passed, ${results.failed} failed</h2>`;
    
    results.details.forEach(detail => {
        const resultClass = detail.passed ? 'test-passed' : 'test-failed';
        
        html += `
            <div class="test-case ${resultClass}">
                <h3>Test ${detail.testNumber}: ${detail.passed ? 'PASSED' : 'FAILED'}</h3>
                <div class="test-details">
                    <div><strong>Aria Label:</strong> ${detail.ariaLabel}</div>
                    <div><strong>Expected LaTeX:</strong> ${detail.expectedLatex}</div>
                    <div><strong>Actual LaTeX:</strong> ${detail.actualLatex}</div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Initialize tests when the window loads
window.addEventListener('load', function() {
    if (typeof translateAriaToLatex !== 'function') {
        console.error('The translateAriaToLatex function is not available.');
        return;
    }
    
    const results = runTests();
    displayTestResults(results);
});
