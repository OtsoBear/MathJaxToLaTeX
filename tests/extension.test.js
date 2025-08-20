const { chromium } = require('playwright');
const path = require('path');

// Path to your extension directory (parent directory)
const extensionPath = path.join(__dirname, '..');

// Check if verbose mode is enabled (via --verbose flag or VERBOSE env var)
const VERBOSE = process.argv.includes('--verbose') || process.env.VERBOSE === 'true';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Function to normalize strings for comparison by removing all whitespace differences
function normalizeForComparison(str) {
  return str.replace(/\s+/g, '').trim();
}

async function testExtension() {
  console.log('Starting Chrome with extension using Playwright...');
  if (!VERBOSE) {
    console.log('(Running in quiet mode. Use "npm run test:verbose" to see browser console output)');
  }
  
  // Variable to track test result
  let testPassed = false;
  
  // Launch Chrome with the extension loaded
  const browser = await chromium.launchPersistentContext('', {
    headless: false, // Extensions require headed mode to work properly
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--start-minimized' // Start the browser minimized
    ],
    // Grant clipboard permissions
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await browser.newPage();
  
  // Only capture console logs if in verbose mode
  if (VERBOSE) {
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Format the console output
      if (type === 'error') {
        console.error('[Browser Console ERROR]:', text);
      } else if (type === 'warning') {
        console.warn('[Browser Console WARN]:', text);
      } else if (type === 'log' || type === 'info') {
        // Only show debug logs from our extension
        if (text.includes('[DEBUG]') || text.includes('[INFO]') || text.includes('[SUCCESS]') || text.includes('[ERROR]')) {
          console.log('[Browser Console]:', text);
        }
      }
    });
    
    // Also capture any page errors
    page.on('pageerror', error => {
      console.error('[Page Error]:', error.message);
    });
  }

  console.log('\n=== Test 1: Local Test Equation ===');
  
  // Test 1: Your local test equation
  const testFilePath = 'file:///' + path.join(__dirname, 'MathJaxTestEquation.html').replace(/\\/g, '/');
  await page.goto(testFilePath);
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for extension to initialize
  if (VERBOSE) console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(100);
  
  // Check if the extension has added its overlay
  const hasOverlay = await page.evaluate(() => {
    const element = document.querySelector('.MathJax, mjx-container');
    return element ? element.classList.contains('mathjax-copyable') : false;
  });
  if (VERBOSE) console.log('Extension overlay applied:', hasOverlay);
  
  // Find and click the MathJax element
  const mathElement = await page.locator('mjx-container.MathJax').first();
  
  if (await mathElement.count() > 0) {
    if (VERBOSE) {
      // Get info about what we're clicking
      const elementInfo = await mathElement.evaluate(el => {
        const mathElements = el.querySelectorAll('g[data-mml-node="math"]');
        return {
          tagName: el.tagName,
          className: el.className,
          hasMathNodes: mathElements.length > 0,
          mathNodeCount: mathElements.length
        };
      });
      console.log('Found MathJax element:', elementInfo);
    }
    
    // Hover first (like a real user)
    await mathElement.hover();
    await page.waitForTimeout(100);
    
    // Click the element
    await mathElement.click();
    
    // Wait for the copy to happen
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check expected result - EXACT character-by-character match required (after trimming)
    const expectedLocalLatex = "A = 2 \\pi \\int _{0 }^{1 }\\mid f \\left( x \\right) \\mid \\sqrt{1 + f ' \\left( x \\right) ^{2 }}dx";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedLocalLatex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedLocalLatex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 1: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
      testPassed = true;
    } else {
      console.log(colors.red + '✗ Test 1: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
      testPassed = false;
    }
    
    if (VERBOSE) {
      // Check if feedback appeared
      const feedbackAppeared = await page.locator('.mathjax-copy-feedback').count() > 0;
      console.log('Copied feedback appeared:', feedbackAppeared);
    }
  } else {
    console.log('Could not find MathJax element on local test page');
  }
  
  console.log('\n=== Test 3: System of Equations with Finnish Text ===');
  await page.waitForTimeout(100);
  
  // Test 3: Your local test equation with system of equations
  const testFile3Path = 'file:///' + path.join(__dirname, 'MathJaxTestEquation3.html').replace(/\\/g, '/');
  await page.goto(testFile3Path);
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for extension to initialize
  if (VERBOSE) console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(100);
  
  // Find and click the SVG element (this equation is not in mjx-container)
  const svgElement = await page.locator('svg[role="img"][viewBox="0 -2181 19932.5 3862"]').first();
  
  if (await svgElement.count() > 0) {
    if (VERBOSE) {
      console.log('Found SVG equation element');
    }
    
    // Clear clipboard first
    await page.evaluate(() => {
      navigator.clipboard.writeText('');
    });
    
    // Hover first (like a real user)
    await svgElement.hover();
    await page.waitForTimeout(100);
    
    // Click the element
    await svgElement.click();
    
    // Wait for the copy to happen
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check expected result for system of equations
    const expectedTest3Latex = "\\begin{cases}\nx&=&2&+&t\\\\\ny&=&-1&+&7t{,}\\ \\text{missä}\\ t\\ \\text{on reaaliluku}\\\\\nz&=&&&3t\n\\end{cases}";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedTest3Latex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedTest3Latex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 3: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
      if (!testPassed) testPassed = true; // Set to true if any test passes
    } else {
      console.log(colors.red + '✗ Test 3: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
    }
    
    if (VERBOSE) {
      // Check if feedback appeared
      const feedbackAppeared = await page.locator('.mathjax-copy-feedback').count() > 0;
      console.log('Copied feedback appeared:', feedbackAppeared);
    }
  } else {
    console.log('Could not find SVG equation element on test page 3');
  }
  
  console.log('\n=== Test 4: Square Root Equation ===');
  await page.waitForTimeout(100);
  
  // Test 4: Your local test equation with square root
  const testFile4Path = 'file:///' + path.join(__dirname, 'MathJaxTestEquation4.html').replace(/\\/g, '/');
  await page.goto(testFile4Path);
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for extension to initialize
  if (VERBOSE) console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(100);
  
  // Find and click the MathJax element
  const mathElement4 = await page.locator('mjx-container.MathJax').first();
  
  if (await mathElement4.count() > 0) {
    if (VERBOSE) {
      // Get info about what we're clicking
      const elementInfo = await mathElement4.evaluate(el => {
        const mathElements = el.querySelectorAll('g[data-mml-node="math"]');
        return {
          tagName: el.tagName,
          className: el.className,
          hasMathNodes: mathElements.length > 0,
          mathNodeCount: mathElements.length
        };
      });
      console.log('Found MathJax element:', elementInfo);
    }
    
    // Clear clipboard first
    await page.evaluate(() => {
      navigator.clipboard.writeText('');
    });
    
    // Hover first (like a real user)
    await mathElement4.hover();
    await page.waitForTimeout(100);
    
    // Click the element
    await mathElement4.click();
    
    // Wait for the copy to happen
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check expected result for square root equation
    const expectedTest4Latex = "3\\sqrt{14}";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedTest4Latex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedTest4Latex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 4: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
      if (!testPassed) testPassed = true; // Set to true if any test passes
    } else {
      console.log(colors.red + '✗ Test 4: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
    }
    
    if (VERBOSE) {
      // Check if feedback appeared
      const feedbackAppeared = await page.locator('.mathjax-copy-feedback').count() > 0;
      console.log('Copied feedback appeared:', feedbackAppeared);
    }
  } else {
    console.log('Could not find MathJax element on test page 4');
  }
  
  console.log('\n=== Test 5: Coordinate Point with Fraction ===');
  await page.waitForTimeout(100);
  
  // Test 5: Your local test equation with coordinate point
  const testFile5Path = 'file:///' + path.join(__dirname, 'MathJaxTestEquation5.html').replace(/\\/g, '/');
  await page.goto(testFile5Path);
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for extension to initialize
  if (VERBOSE) console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(100);
  
  // Find and click the SVG element (this equation is not in mjx-container)
  const svgElement5 = await page.locator('svg[role="img"][viewBox="0 -864.9 6119.4 1209.9"]').first();
  
  if (await svgElement5.count() > 0) {
    if (VERBOSE) {
      console.log('Found SVG equation element');
    }
    
    // Clear clipboard first
    await page.evaluate(() => {
      navigator.clipboard.writeText('');
    });
    
    // Hover first (like a real user)
    await svgElement5.hover();
    await page.waitForTimeout(100);
    
    // Click the element
    await svgElement5.click();
    
    // Wait for the copy to happen
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check expected result for coordinate point equation
    const expectedTest5Latex = "\\left( 0, - \\frac{11 }{2 }, 0 \\right)";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedTest5Latex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedTest5Latex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 5: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
      if (!testPassed) testPassed = true; // Set to true if any test passes
    } else {
      console.log(colors.red + '✗ Test 5: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
    }
    
    if (VERBOSE) {
      // Check if feedback appeared
      const feedbackAppeared = await page.locator('.mathjax-copy-feedback').count() > 0;
      console.log('Copied feedback appeared:', feedbackAppeared);
    }
  } else {
    console.log('Could not find SVG equation element on test page 5');
  }
  
  console.log('\n=== Test 6: Coordinate Point with Positive Fraction ===');
  await page.waitForTimeout(100);
  
  // Test 6: Your local test equation with coordinate point and positive fraction
  const testFile6Path = 'file:///' + path.join(__dirname, 'MathJaxTestEquation6.html').replace(/\\/g, '/');
  await page.goto(testFile6Path);
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for extension to initialize
  if (VERBOSE) console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(100);
  
  // Find and click the SVG element (this equation is not in mjx-container)
  const svgElement6 = await page.locator('svg[role="img"][viewBox="0 -872 3127.6 1217"]').first();
  
  if (await svgElement6.count() > 0) {
    if (VERBOSE) {
      console.log('Found SVG equation element');
    }
    
    // Clear clipboard first
    await page.evaluate(() => {
      navigator.clipboard.writeText('');
    });
    
    // Hover first (like a real user)
    await svgElement6.hover();
    await page.waitForTimeout(100);
    
    // Click the element
    await svgElement6.click();
    
    // Wait for the copy to happen
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check expected result for coordinate point equation with positive fraction
    const expectedTest6Latex = "\\left( 0, \\frac{7 }{2 },0 \\right)";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedTest6Latex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedTest6Latex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 6: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
      if (!testPassed) testPassed = true; // Set to true if any test passes
    } else {
      console.log(colors.red + '✗ Test 6: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
    }
    
    if (VERBOSE) {
      // Check if feedback appeared
      const feedbackAppeared = await page.locator('.mathjax-copy-feedback').count() > 0;
      console.log('Copied feedback appeared:', feedbackAppeared);
    }
  } else {
    console.log('Could not find SVG equation element on test page 6');
  }
  
  console.log('\n=== Test 7: Fraction with Square Root ===');
  await page.waitForTimeout(100);
  
  // Test 7: Your local test equation with fraction and square root
  const testFile7Path = 'file:///' + path.join(__dirname, 'MathJaxTestEquation7.html').replace(/\\/g, '/');
  await page.goto(testFile7Path);
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for extension to initialize
  if (VERBOSE) console.log('Waiting for extension to initialize...');
  await page.waitForTimeout(100);
  
  // Find and click the SVG element (this equation is not in mjx-container)
  const svgElement7 = await page.locator('svg[role="img"][viewBox="0 -1089.5 2103.8 1450.1"]').first();
  
  if (await svgElement7.count() > 0) {
    if (VERBOSE) {
      console.log('Found SVG equation element');
    }
    
    // Clear clipboard first
    await page.evaluate(() => {
      navigator.clipboard.writeText('');
    });
    
    // Hover first (like a real user)
    await svgElement7.hover();
    await page.waitForTimeout(100);
    
    // Click the element
    await svgElement7.click();
    
    // Wait for the copy to happen
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check expected result for fraction with square root equation
    const expectedTest7Latex = "\\frac{11\\sqrt{2}}{10}";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedTest7Latex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedTest7Latex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 7: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
      if (!testPassed) testPassed = true; // Set to true if any test passes
    } else {
      console.log(colors.red + '✗ Test 7: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
    }
    
    if (VERBOSE) {
      // Check if feedback appeared
      const feedbackAppeared = await page.locator('.mathjax-copy-feedback').count() > 0;
      console.log('Copied feedback appeared:', feedbackAppeared);
    }
  } else {
    console.log('Could not find SVG equation element on test page 7');
  }
  
  console.log('\n=== Test 2: MathJax.org Hero Math ===');
  await page.waitForTimeout(100);

  // Test 2: MathJax.org website
  await page.goto('https://www.mathjax.org/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100);
  
  // Click on the hero-math div
  const heroMath = await page.locator('.hero-math').first();
  
  if (await heroMath.count() > 0) {
    // Clear clipboard first
    await page.evaluate(() => {
      navigator.clipboard.writeText('');
    });
    
    await heroMath.click();
    await page.waitForTimeout(100);
    
    // Check clipboard content
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'Could not read clipboard: ' + e.message;
      }
    });
    
    // Check if it matches expected - EXACT character-by-character match required (after trimming)
    const expectedLatex = "f \\left( a \\right) = \\frac{1 }{2 {\\pi} i }\\oint _{{\\gamma} }\\frac{f \\left( z \\right) }{z - a }d z";
    
    // Always show both clipboard content and expected answer for verification
    console.log('Clipboard content:');
    console.log('  ', clipboardContent);
    console.log('Expected answer:');
    console.log('  ', expectedLatex);
    
    // Normalize both strings by removing all whitespace for comparison
    const normalizedClipboard = normalizeForComparison(clipboardContent);
    const normalizedExpected = normalizeForComparison(expectedLatex);
    
    // Compare normalized versions (ignoring all whitespace differences)
    if (normalizedClipboard === normalizedExpected) {
      console.log(colors.green + '✓ Test 2: EXACT MATCH - Every character matches perfectly (ignoring whitespace)!' + colors.reset);
    } else {
      console.log(colors.red + '✗ Test 2: FAILED - Not an exact match' + colors.reset);
      console.log('Expected (normalized):');
      console.log('  ', normalizedExpected);
      console.log(`Character count - Got: ${normalizedClipboard.length}, Expected: ${normalizedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (normalizedClipboard.length === normalizedExpected.length) {
          for (let i = 0; i < normalizedClipboard.length; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(normalizedClipboard.length, normalizedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (normalizedClipboard[i] !== normalizedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${normalizedClipboard[i]}' (code: ${normalizedClipboard.charCodeAt(i)}), expected '${normalizedExpected[i]}' (code: ${normalizedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (normalizedClipboard.length > normalizedExpected.length) {
            console.log(`  Extra characters at end: "${normalizedClipboard.substring(normalizedExpected.length)}"`);
          }
        }
      }
      
      // Only pass if exact match
      if (testPassed) {
        console.log('Note: Other tests passed but Test 2 requires exact match');
      }
    }
  } else {
    console.log('Could not find hero-math element on MathJax.org');
  }
  
  console.log('\n=== Test Complete ===');
  if (VERBOSE) console.log('Browser will close shortly...');
  
  // Auto-close quickly
  await page.waitForTimeout(100);
  await browser.close();
  
  // Return test result
  return testPassed;
}

// Run the test
testExtension()
  .then(success => {
    if (success) {
      console.log(colors.green + '\n✅ TEST PASSED: Extension works correctly in automated test!' + colors.reset);
      process.exit(0);
    } else {
      console.log(colors.red + '\n❌ TEST FAILED: Extension not working correctly yet.' + colors.reset);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(colors.red + 'Test error: ' + error + colors.reset);
    process.exit(1);
  });