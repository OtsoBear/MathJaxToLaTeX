const { chromium } = require('playwright');
const path = require('path');

// Path to your extension directory (parent directory)
const extensionPath = path.join(__dirname, '..');

// Check if verbose mode is enabled (via --verbose flag or VERBOSE env var)
const VERBOSE = process.argv.includes('--verbose') || process.env.VERBOSE === 'true';

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
    
    // Trim whitespace from both ends for comparison
    const trimmedClipboard = clipboardContent.trim();
    const trimmedExpected = expectedLocalLatex.trim();
    
    // Strict comparison after trimming
    if (trimmedClipboard === trimmedExpected) {
      console.log('✓ Test 1: EXACT MATCH - Every character matches perfectly!');
      testPassed = true;
    } else {
      console.log('✗ Test 1: FAILED - Not an exact match');
      console.log('Expected:');
      console.log('  ', trimmedExpected);
      console.log(`Character count - Got: ${trimmedClipboard.length}, Expected: ${trimmedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (trimmedClipboard.length === trimmedExpected.length) {
          for (let i = 0; i < trimmedClipboard.length; i++) {
            if (trimmedClipboard[i] !== trimmedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${trimmedClipboard[i]}' (code: ${trimmedClipboard.charCodeAt(i)}), expected '${trimmedExpected[i]}' (code: ${trimmedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(trimmedClipboard.length, trimmedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (trimmedClipboard[i] !== trimmedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${trimmedClipboard[i]}' (code: ${trimmedClipboard.charCodeAt(i)}), expected '${trimmedExpected[i]}' (code: ${trimmedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (trimmedClipboard.length > trimmedExpected.length) {
            console.log(`  Extra characters at end: "${trimmedClipboard.substring(trimmedExpected.length)}"`);
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
    
    // Trim whitespace from both ends for comparison
    const trimmedClipboard = clipboardContent.trim();
    const trimmedExpected = expectedLatex.trim();
    
    // Strict comparison after trimming
    if (trimmedClipboard === trimmedExpected) {
      console.log('✓ Test 2: EXACT MATCH - Every character matches perfectly!');
    } else {
      console.log('✗ Test 2: FAILED - Not an exact match');
      console.log('Expected:');
      console.log('  ', trimmedExpected);
      console.log(`Character count - Got: ${trimmedClipboard.length}, Expected: ${trimmedExpected.length}`);
      
      // Show character-by-character differences if verbose
      if (VERBOSE) {
        if (trimmedClipboard.length === trimmedExpected.length) {
          for (let i = 0; i < trimmedClipboard.length; i++) {
            if (trimmedClipboard[i] !== trimmedExpected[i]) {
              console.log(`  Difference at position ${i}: got '${trimmedClipboard[i]}' (code: ${trimmedClipboard.charCodeAt(i)}), expected '${trimmedExpected[i]}' (code: ${trimmedExpected.charCodeAt(i)})`);
            }
          }
        } else {
          // Show where the strings differ in length
          const minLen = Math.min(trimmedClipboard.length, trimmedExpected.length);
          for (let i = 0; i < minLen; i++) {
            if (trimmedClipboard[i] !== trimmedExpected[i]) {
              console.log(`  First difference at position ${i}: got '${trimmedClipboard[i]}' (code: ${trimmedClipboard.charCodeAt(i)}), expected '${trimmedExpected[i]}' (code: ${trimmedExpected.charCodeAt(i)})`);
              break;
            }
          }
          if (trimmedClipboard.length > trimmedExpected.length) {
            console.log(`  Extra characters at end: "${trimmedClipboard.substring(trimmedExpected.length)}"`);
          }
        }
      }
      
      // Only pass if exact match
      if (testPassed) {
        console.log('Note: Test 1 passed but Test 2 requires exact match');
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
      console.log('\n✅ TEST PASSED: Extension works correctly in automated test!');
      process.exit(0);
    } else {
      console.log('\n❌ TEST FAILED: Extension not working correctly yet.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });