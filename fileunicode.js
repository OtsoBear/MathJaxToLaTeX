const unicode_to_tex = {
    // Basic ASCII characters
    "U+0020": "  ",                     // Space
    "U+0021": "! ",                     // Exclamation mark
    "U+0022": "\\textquotedbl{} ",      // Quotation mark
    "U+0023": "\\# ",                   // Number sign (hash)
    "U+0024": "\\$ ",                   // Dollar sign
    "U+0025": "\\% ",                   // Percent sign
    "U+0026": "\\& ",                   // Ampersand
    "U+0027": "' ",                     // Apostrophe
    "U+0028": "( ",                     // Left parenthesis
    "U+0029": ") ",                     // Right parenthesis
    "U+002A": "* ",                     // Asterisk
    "U+002B": "+ ",                     // Plus sign
    "U+002C":  ", ",                     // Comma
    "U+002D": "- ",                     // Hyphen-minus
    "U+002E": ". ",                     // Full stop (period)
    "U+002F": "/ ",                     // Solidus (slash)
    "U+0030": "0 ", "U+0031": "1 ", "U+0032": "2 ", "U+0033": "3 ", "U+0034": "4 ", // Digits 0-4
    "U+0035": "5 ", "U+0036": "6 ", "U+0037": "7 ", "U+0038": "8 ", "U+0039": "9 ", // Digits 5-9
    "U+003A": ": ",                     // Colon
    "U+003B": "; ",                     // Semicolon
    "U+003C": "< ",                     // Less-than sign
    "U+003D": "= ",                     // Equals sign
    "U+003E": "> ",                     // Greater-than sign
    "U+003F": "? ",                     // Question mark
    "U+0040": "@ ",                     // Commercial at
    "U+005F": "\\_ ",                   // Underscore
    "U+007E": "\\textasciitilde ",      // Tilde
    "U+005E": "\\textasciicircum ",     // Caret
    
    // Latin letters - Uppercase (A-Z)
    "U+0041": "A ", "U+0042": "B ", "U+0043": "C ", "U+0044": "D ", "U+0045": "E ",
    "U+0046": "F ", "U+0047": "G ", "U+0048": "H ", "U+0049": "I ", "U+004A": "J ",
    "U+004B": "K ", "U+004C": "L ", "U+004D": "M ", "U+004E": "N ", "U+004F": "O ",
    "U+0050": "P ", "U+0051": "Q ", "U+0052": "R ", "U+0053": "S ", "U+0054": "T ",
    "U+0055": "U ", "U+0056": "V ", "U+0057": "W ", "U+0058": "X ", "U+0059": "Y ", "U+005A": "Z ",
    
    // Latin letters - Lowercase (a-z)
    "U+0061": "a ", "U+0062": "b ", "U+0063": "c ", "U+0064": "d ", "U+0065": "e ",
    "U+0066": "f ", "U+0067": "g ", "U+0068": "h ", "U+0069": "i ", "U+006A": "j ",
    "U+006B": "k ", "U+006C": "l ", "U+006D": "m ", "U+006E": "n ", "U+006F": "o ",
    "U+0070": "p ", "U+0071": "q ", "U+0072": "r ", "U+0073": "s ", "U+0074": "t ",
    "U+0075": "u ", "U+0076": "v ", "U+0077": "w ", "U+0078": "x ", "U+0079": "y ", "U+007A": "z ",
    
    // Math italic letters - Uppercase (𝐴-𝑍)
    "U+1D434": "A ", "U+1D435": "B ", "U+1D436": "C ", "U+1D437": "D ", "U+1D438": "E ",
    "U+1D439": "F ", "U+1D43A": "G ", "U+1D43B": "H ", "U+1D43C": "I ", "U+1D43D": "J ",
    "U+1D43E": "K ", "U+1D43F": "L ", "U+1D440": "M ", "U+1D441": "N ", "U+1D442": "O ",
    "U+1D443": "P ", "U+1D444": "Q ", "U+1D445": "R ", "U+1D446": "S ", "U+1D447": "T ",
    "U+1D448": "U ", "U+1D449": "V ", "U+1D44A": "W ", "U+1D44B": "X ", "U+1D44C": "Y ", "U+1D44D": "Z ",
    
    // Math italic letters - Lowercase (𝑎-𝑧)
    "U+1D44E": "a ", "U+1D44F": "b ", "U+1D450": "c ", "U+1D451": "d ", "U+1D452": "e ",
    "U+1D453": "f ", "U+1D454": "g ", "U+1D455": "h ", "U+1D456": "i ", "U+1D457": "j ",
    "U+1D458": "k ", "U+1D459": "l ", "U+1D45A": "m ", "U+1D45B": "n ", "U+1D45C": "o ",
    "U+1D45D": "p ", "U+1D45E": "q ", "U+1D45F": "r ", "U+1D460": "s ", "U+1D461": "t ",
    "U+1D462": "u ", "U+1D463": "v ", "U+1D464": "w ", "U+1D465": "x ", "U+1D466": "y ", "U+1D467": "z ",
    
    // Math Italic Greek letters - Uppercase (Α-Ω) - Excluding duplicates like A, B, E, etc.
    "U+1D6E2": "{\\mathit{\\Gamma}} ", "U+1D6E3": "{\\mathit{\\Delta}} ", "U+1D6E7": "{\\mathit{\\Theta}} ",
    "U+1D6EA": "{\\mathit{\\Lambda}} ", "U+1D6EC": "{\\mathit{\\Xi}} ", "U+1D6ED": "{\\mathit{\\Pi}} ",
    "U+1D6EF": "{\\mathit{\\Sigma}} ", "U+1D6F1": "{\\mathit{\\Upsilon}} ", "U+1D6F2": "{\\mathit{\\Phi}} ",
    "U+1D6F4": "{\\mathit{\\Psi}} ", "U+1D6F6": "{\\mathit{\\Omega}} ",

    // Math Italic Greek letters - Lowercase (α-ω)
    "U+1D6FC": "{\\alpha} ", "U+1D6FD": "{\\beta} ", "U+1D6FE": "{\\gamma} ", "U+1D6FF": "{\\delta} ",
    "U+1D700": "{\\epsilon} ", "U+1D701": "{\\zeta} ", "U+1D702": "{\\eta} ", // U+1D703 (theta) already exists
    "U+1D704": "{\\iota} ", "U+1D705": "{\\kappa} ", "U+1D706": "{\\lambda} ", "U+1D707": "{\\mu} ",
    "U+1D708": "{\\nu} ", "U+1D709": "{\\xi} ", "U+1D70A": "o ", // Italic 'o' looks like regular 'o'
    // U+1D70B (pi) already exists
    "U+1D70C": "{\\rho} ", "U+1D70D": "{\\varsigma} ", "U+1D70E": "{\\sigma} ", "U+1D70F": "{\\tau} ",
    "U+1D710": "{\\upsilon} ", // U+1D711 (phi) handled by U+1D719
    "U+1D712": "{\\chi} ", "U+1D713": "{\\psi} ", "U+1D714": "{\\omega} ",
    // Italic Greek Symbols
    "U+1D716": "{\\vartheta} ", "U+1D717": "{\\varphi} ", "U+1D718": "{\\varpi} ",
    // U+1D719 (phi) already exists
    "U+1D71A": "{\\varrho} ", "U+1D71B": "{\\varepsilon} ",

    // Greek letters - Uppercase
    "U+0391": "A ", "U+0392": "B ", "U+0393": "{\\Gamma} ", "U+0394": "{\\Delta} ",
    "U+0395": "E ", "U+0396": "Z ", "U+0397": "H ", "U+0398": "{\\Theta} ",
    "U+0399": "I ", "U+039A": "K ", "U+039B": "{\\Lambda} ", "U+039C": "M ",
    "U+039D": "N ", "U+039E": "{\\Xi} ", "U+039F": "O ", "U+03A0": "{\\Pi} ",
    "U+03A1": "P ", "U+03A3": "{\\Sigma} ", "U+03A4": "T ", "U+03A5": "{\\Upsilon} ",
    "U+03A6": "{\\Phi} ", "U+03A7": "X ", "U+03A8": "{\\Psi} ", "U+03A9": "{\\Omega} ",
    "U+1D6FE": "{\\gamma} ", // gamma (𝛾 - Mathematical italic gamma)
    
    // Greek letters - Lowercase
    "U+03B1": "{\\alpha} ", "U+03B2": "{\\beta} ", "U+03B3": "{\\gamma} ", "U+03B4": "{\\delta} ",
    "U+03B5": "{\\epsilon} ", "U+03B6": "{\\zeta} ", "U+03B7": "{\\eta} ", "U+03B8": "{\\theta} ",
    "U+03B9": "{\\iota} ", "U+03BA": "{\\kappa} ", "U+03BB": "{\\lambda} ", "U+03BC": "{\\mu} ",
    "U+03BD": "{\\nu} ", "U+03BE": "{\\xi} ", "U+03BF": "o ", "U+03C0": "{\\pi} ",
    "U+03C1": "{\\rho} ", "U+03C2": "{\\varsigma} ", "U+03C3": "{\\sigma} ", "U+03C4": "{\\tau} ",
    "U+03C5": "{\\upsilon} ", "U+03C6": "{\\phi} ", "U+03C7": "{\\chi} ", "U+03C8": "{\\psi} ",
    "U+03C9": "{\\omega} ",
    "U+1D70B": "{\\pi} ", // Mathematical italic pi
    "U+1D703": "{\\theta} ", // Mathematical italic theta
    "U+1D719": "{\\phi} ", // Mathematical italic phi
    
    "U+2207": "{\\nabla} ", 

    "U+1D715": "{\\partial} ", 
    "U+1D422": "{\\mathbf{i}} ", 
    "U+1D423": "{\\mathbf{j}} ", 
    "U+1D424": "{\\mathbf{k}} ",
    
    // Vector notation
    "U+20D7": "\\overrightarrow ",  // Combining right arrow above (vector notation)

    // Mathematical constants and symbols
    "U+03C0": "{\\pi} ",        // Pi
    "U+2107": "{\\euler} ",     // Euler's constant (e)
    "U+212F": "{\\mathscr{e}} ", // Script e
    "U+03F5": "{\\epsilon} ",   // Epsilon
    "U+00B1": "{\\pm} ",        // Plus-minus
    "U+2213": "{\\mp} ",        // Minus-plus
    
    // Common math operators and symbols
    "U+2212": "- ",           // Minus sign
    "U+2223": "| ",           // Vertical bar
    "U+2260": "\\neq ",       // Not equal to
    "U+2264": "\\leq ",       // Less than or equal to
    "U+2265": "\\geq ",       // Greater than or equal to
    "U+2248": "\\approx ",    // Almost equal to
    "U+2261": "\\equiv ",     // Identical to
    
    // Special operators
    "U+00D7": "\\times ",     // Multiplication sign
    "U+00F7": "\\div ",       // Division sign
    "U+2218": "\\circ ",      // Composition operator
    "U+22C5": "\\cdot ",      // Dot operator
    "U+222B": "\\int ",       // Integral
    "U+222C": "\\iint ",      // Double integral
    "U+222D": "\\iiint ",     // Triple integral
    "U+2211": "\\sum ",       // Sum
    "U+220F": "\\prod ",      // Product
    "U+2202": "\\partial ",   // Partial differential
    "U+221E": "\\infty ",     // Infinity
    "U+00B0": "° ",   // Degree sign
    
    // Misc symbols
    "U+2032": "' ",           // Prime
    "U+221A": " ",            // Square root - handled separately by msqrt
    "U+2061": " ",            // Function application
    "U+2062": " ",            // Invisible times
    
    // Set theory and logic symbols
    "U+2205": "\\emptyset ",  // Empty set
    "U+2203": "\\exists ",    // There exists
    "U+2200": "\\forall ",    // For all
    "U+2192": "\\rightarrow ", // Right arrow (implication)
    "U+21D2": "\\Rightarrow ", // Double right arrow (implies)
    "U+21A6": "\\mapsto ",    // Maps to
    "U+2713": "\\checkmark ", // Checkmark
    "U+2102": "\\mathbb{C} ", // Complex numbers
    "U+211D": "\\mathbb{R} ", // Real numbers
    "U+2124": "\\mathbb{Z} ", // Integers
    "U+2115": "\\mathbb{N} ", // Natural numbers
    "U+211A": "\\mathbb{Q} ", // Rational numbers
    "U+2223": "\\mid ",       // Such that (divides)
    "U+2225": "\\parallel ",  // Parallel to

    // Special mappings for mathematical functions
    "function:sin": "\\sin ",
    "function:cos": "\\cos ",
    "function:tan": "\\tan ",
    "function:csc": "\\csc ",
    "function:sec": "\\sec ",
    "function:cot": "\\cot ",
    "function:log": "\\log ",
    "function:ln": "\\ln ",
    "function:arcsin": "\\arcsin ",
    "function:arccos": "\\arccos ",
    "function:arctan": "\\arctan ",
    "function:arccot": "\\arccot ",
    "function:arcsec": "\\arcsec ",
    "function:arccsc": "\\arccsc ",
    "function:sinh": "\\sinh ",
    "function:cosh": "\\cosh ",
    "function:tanh": "\\tanh ",
    "function:lim": "\\lim ",
    "function:max": "\\max ",
    "function:min": "\\min ",
    "function:sup": "\\sup ",
    "function:inf": "\\inf ",
    "function:det": "\\det ",
    "function:exp": "\\exp ",
    "function:arg": "\\arg ",
    "function:deg": "\\deg ",
    "function:gcd": "\\gcd ",

    // Additional Greek letter variants
    "U+03D1": "{\\vartheta} ",  // Greek theta symbol
    "U+03D5": "{\\varphi} ",    // Greek phi symbol
    "U+03D6": "{\\varpi} ",     // Greek pi symbol
    "U+03F0": "{\\varkappa} ",  // Greek kappa symbol
    "U+03F1": "{\\varrho} ",    // Greek rho symbol
    "U+03F4": "{\\varsigma} ",  // Greek sigma symbol
    "U+03F5": "{\\varepsilon} ", // Greek lunate epsilon symbol
    
    // Blackboard bold (double-struck) letters for sets
    "U+1D538": "\\mathbb{A} ", "U+1D539": "\\mathbb{B} ", 
    "U+1D53B": "\\mathbb{D} ", "U+1D53C": "\\mathbb{E} ", "U+1D53D": "\\mathbb{F} ",
    "U+1D53E": "\\mathbb{G} ", "U+1D540": "\\mathbb{I} ", "U+1D541": "\\mathbb{J} ",
    "U+1D542": "\\mathbb{K} ", "U+1D543": "\\mathbb{L} ", "U+1D544": "\\mathbb{M} ",
    "U+1D546": "\\mathbb{O} ", "U+1D54A": "\\mathbb{S} ", "U+1D54B": "\\mathbb{T} ",
    "U+1D54C": "\\mathbb{U} ", "U+1D54D": "\\mathbb{V} ", "U+1D54E": "\\mathbb{W} ",
    "U+1D54F": "\\mathbb{X} ", "U+1D550": "\\mathbb{Y} ",
    "U+1D552": "\\mathbb{a} ", "U+1D553": "\\mathbb{b} ", "U+1D554": "\\mathbb{c} ",
    "U+1D555": "\\mathbb{d} ", "U+1D556": "\\mathbb{e} ", "U+1D557": "\\mathbb{f} ",
    "U+1D558": "\\mathbb{g} ", "U+1D559": "\\mathbb{h} ", "U+1D55A": "\\mathbb{i} ",
    "U+1D55B": "\\mathbb{j} ", "U+1D55C": "\\mathbb{k} ", "U+1D55D": "\\mathbb{l} ",
    "U+1D55E": "\\mathbb{m} ", "U+1D55F": "\\mathbb{n} ", "U+1D560": "\\mathbb{o} ",
    "U+1D561": "\\mathbb{p} ", "U+1D562": "\\mathbb{q} ", "U+1D563": "\\mathbb{r} ",
    "U+1D564": "\\mathbb{s} ", "U+1D565": "\\mathbb{t} ", "U+1D566": "\\mathbb{u} ",
    "U+1D567": "\\mathbb{v} ", "U+1D568": "\\mathbb{w} ", "U+1D569": "\\mathbb{x} ",
    "U+1D56A": "\\mathbb{y} ", "U+1D56B": "\\mathbb{z} ",
    
    // Script/calligraphic letters
    "U+1D49C": "\\mathcal{A} ", "U+1D49E": "\\mathcal{C} ", "U+1D49F": "\\mathcal{D} ",
    "U+1D4A2": "\\mathcal{G} ", "U+1D4A5": "\\mathcal{J} ", "U+1D4A6": "\\mathcal{K} ",
    "U+1D4A9": "\\mathcal{N} ", "U+1D4AA": "\\mathcal{O} ", "U+1D4AB": "\\mathcal{P} ",
    "U+1D4AC": "\\mathcal{Q} ", "U+1D4AE": "\\mathcal{S} ", "U+1D4AF": "\\mathcal{T} ",
    "U+1D4B0": "\\mathcal{U} ", "U+1D4B1": "\\mathcal{V} ", "U+1D4B2": "\\mathcal{W} ",
    "U+1D4B3": "\\mathcal{X} ", "U+1D4B4": "\\mathcal{Y} ", "U+1D4B5": "\\mathcal{Z} ",
    "U+212C": "\\mathcal{B} ", "U+2130": "\\mathcal{E} ", "U+2131": "\\mathcal{F} ",
    "U+210B": "\\mathcal{H} ", "U+2110": "\\mathcal{I} ", "U+2112": "\\mathcal{L} ",
    "U+2133": "\\mathcal{M} ", "U+211B": "\\mathcal{R} ",
    
    // Fraktur letters
    "U+1D504": "\\mathfrak{A} ", "U+1D505": "\\mathfrak{B} ", "U+1D507": "\\mathfrak{D} ",
    "U+1D508": "\\mathfrak{E} ", "U+1D509": "\\mathfrak{F} ", "U+1D50A": "\\mathfrak{G} ",
    "U+1D50D": "\\mathfrak{J} ", "U+1D50E": "\\mathfrak{K} ", "U+1D50F": "\\mathfrak{L} ",
    "U+1D510": "\\mathfrak{M} ", "U+1D511": "\\mathfrak{N} ", "U+1D512": "\\mathfrak{O} ",
    "U+1D513": "\\mathfrak{P} ", "U+1D514": "\\mathfrak{Q} ", "U+1D516": "\\mathfrak{S} ",
    "U+1D517": "\\mathfrak{T} ", "U+1D518": "\\mathfrak{U} ", "U+1D519": "\\mathfrak{V} ",
    "U+1D51A": "\\mathfrak{W} ", "U+1D51B": "\\mathfrak{X} ", "U+1D51C": "\\mathfrak{Y} ",
    "U+1D51E": "\\mathfrak{a} ", "U+1D51F": "\\mathfrak{b} ", "U+1D520": "\\mathfrak{c} ",
    "U+1D521": "\\mathfrak{d} ", "U+1D522": "\\mathfrak{e} ", "U+1D523": "\\mathfrak{f} ",
    "U+1D524": "\\mathfrak{g} ", "U+1D525": "\\mathfrak{h} ", "U+1D526": "\\mathfrak{i} ",
    "U+1D527": "\\mathfrak{j} ", "U+1D528": "\\mathfrak{k} ", "U+1D529": "\\mathfrak{l} ",
    "U+1D52A": "\\mathfrak{m} ", "U+1D52B": "\\mathfrak{n} ", "U+1D52C": "\\mathfrak{o} ",
    "U+1D52D": "\\mathfrak{p} ", "U+1D52E": "\\mathfrak{q} ", "U+1D52F": "\\mathfrak{r} ",
    "U+1D530": "\\mathfrak{s} ", "U+1D531": "\\mathfrak{t} ", "U+1D532": "\\mathfrak{u} ",
    "U+1D533": "\\mathfrak{v} ", "U+1D534": "\\mathfrak{w} ", "U+1D535": "\\mathfrak{x} ",
    "U+1D536": "\\mathfrak{y} ", "U+1D537": "\\mathfrak{z} ",
    "U+212D": "\\mathfrak{C} ", "U+210C": "\\mathfrak{H} ", "U+2111": "\\mathfrak{I} ",
    "U+211C": "\\mathfrak{R} ", "U+2128": "\\mathfrak{Z} ",
    
    // Bold math letters
    "U+1D400": "\\mathbf{A} ", "U+1D401": "\\mathbf{B} ", "U+1D402": "\\mathbf{C} ",
    "U+1D403": "\\mathbf{D} ", "U+1D404": "\\mathbf{E} ", "U+1D405": "\\mathbf{F} ",
    "U+1D406": "\\mathbf{G} ", "U+1D407": "\\mathbf{H} ", "U+1D408": "\\mathbf{I} ",
    "U+1D409": "\\mathbf{J} ", "U+1D40A": "\\mathbf{K} ", "U+1D40B": "\\mathbf{L} ",
    "U+1D40C": "\\mathbf{M} ", "U+1D40D": "\\mathbf{N} ", "U+1D40E": "\\mathbf{O} ",
    "U+1D40F": "\\mathbf{P} ", "U+1D410": "\\mathbf{Q} ", "U+1D411": "\\mathbf{R} ",
    "U+1D412": "\\mathbf{S} ", "U+1D413": "\\mathbf{T} ", "U+1D414": "\\mathbf{U} ",
    "U+1D415": "\\mathbf{V} ", "U+1D416": "\\mathbf{W} ", "U+1D417": "\\mathbf{X} ",
    "U+1D418": "\\mathbf{Y} ", "U+1D419": "\\mathbf{Z} ",
    
    // Additional arrows
    "U+2190": "\\leftarrow ",      // Left arrow
    "U+2191": "\\uparrow ",        // Up arrow
    "U+2193": "\\downarrow ",      // Down arrow
    "U+2194": "\\leftrightarrow ", // Left-right arrow
    "U+2195": "\\updownarrow ",    // Up-down arrow
    "U+2196": "\\nwarrow ",        // Northwest arrow
    "U+2197": "\\nearrow ",        // Northeast arrow
    "U+2198": "\\searrow ",        // Southeast arrow
    "U+2199": "\\swarrow ",        // Southwest arrow
    "U+219D": "\\rightsquigarrow ", // Rightwards squiggle arrow
    "U+21A0": "\\twoheadrightarrow ", // Rightwards two headed arrow
    "U+21A3": "\\rightarrowtail ", // Rightwards arrow with tail
    "U+21B0": "\\Lsh ",           // Upwards arrow with tip leftwards
    "U+21B1": "\\Rsh ",           // Upwards arrow with tip rightwards
    "U+21CB": "\\leftrightharpoons ", // Left and right harpoons
    "U+21CC": "\\rightleftharpoons ", // Right and left harpoons
    "U+21D0": "\\Leftarrow ",      // Left double arrow
    "U+21D1": "\\Uparrow ",        // Up double arrow
    "U+21D3": "\\Downarrow ",      // Down double arrow
    "U+21D4": "\\Leftrightarrow ", // Left-right double arrow
    "U+21D5": "\\Updownarrow ",    // Up-down double arrow
    
    // Additional comparison and logical operators
    "U+2208": "\\in ",            // Element of
    "U+2209": "\\notin ",         // Not an element of
    "U+220B": "\\ni ",            // Contains as member
    "U+220C": "\\not\\ni ",       // Does not contain as member
    "U+2216": "\\setminus ",      // Set minus
    "U+2227": "\\wedge ",         // Logical and
    "U+2228": "\\vee ",           // Logical or
    "U+2229": "\\cap ",           // Intersection
    "U+222A": "\\cup ",           // Union
    "U+2234": "\\therefore ",     // Therefore
    "U+2235": "\\because ",       // Because
    "U+2237": "\\Colon ",         // Proportion
    "U+2243": "\\simeq ",         // Asymptotically equal to
    "U+2245": "\\cong ",          // Approximately equal to
    "U+2247": "\\ncong ",         // Not congruent to
    "U+2248": "\\approx ",        // Almost equal to
    "U+2249": "\\not\\approx ",   // Not almost equal to
    "U+224D": "\\asymp ",         // Equivalent to
    "U+2250": "\\doteq ",         // Approaches the limit
    "U+2254": "\\coloneq ",       // Colon equals
    "U+2255": "\\eqcolon ",       // Equals colon
    "U+2256": "\\eqcirc ",        // Ring in equal to
    "U+2257": "\\circeq ",        // Ring equal to
    "U+225C": "\\triangleq ",     // Delta equal to
    "U+2266": "\\leqq ",          // Less than or equal to (double line)
    "U+2267": "\\geqq ",          // Greater than or equal to (double line)
    "U+226A": "\\ll ",            // Much less than
    "U+226B": "\\gg ",            // Much greater than
    "U+226E": "\\nless ",         // Not less than
    "U+226F": "\\ngtr ",          // Not greater than
    "U+2270": "\\nleq ",          // Not less than or equal
    "U+2271": "\\ngeq ",          // Not greater than or equal
    "U+2272": "\\lesssim ",       // Less than or equivalent
    "U+2273": "\\gtrsim ",        // Greater than or equivalent
    "U+2276": "\\lessgtr ",       // Less than or greater than
    "U+2277": "\\gtrless ",       // Greater than or less than
    "U+227A": "\\prec ",          // Precedes
    "U+227B": "\\succ ",          // Succeeds
    "U+227C": "\\preceq ",        // Precedes or equal
    "U+227D": "\\succeq ",        // Succeeds or equal
    "U+227E": "\\precsim ",       // Precedes or equivalent
    "U+227F": "\\succsim ",       // Succeeds or equivalent
    "U+2282": "\\subset ",        // Subset of
    "U+2283": "\\supset ",        // Superset of
    "U+2284": "\\not\\subset ",   // Not a subset of
    "U+2285": "\\not\\supset ",   // Not a superset of
    "U+2286": "\\subseteq ",      // Subset of or equal to
    "U+2287": "\\supseteq ",      // Superset of or equal to
    "U+2288": "\\nsubseteq ",     // Not subset of or equal to
    "U+2289": "\\nsupseteq ",     // Not superset of or equal to
    "U+228A": "\\subsetneq ",     // Subset of, not equal to
    "U+228B": "\\supsetneq ",     // Superset of, not equal to
    
    // Additional brackets and delimiters
    "U+2308": "\\lceil ",         // Left ceiling
    "U+2309": "\\rceil ",         // Right ceiling
    "U+230A": "\\lfloor ",        // Left floor
    "U+230B": "\\rfloor ",        // Right floor
    "U+2329": "\\langle ",        // Left angle bracket
    "U+232A": "\\rangle ",        // Right angle bracket
    "U+27E8": "\\langle ",        // Mathematical left angle bracket
    "U+27E9": "\\rangle ",        // Mathematical right angle bracket
    "U+2983": "\\{| ",            // Left curly bracket with bar
    "U+2984": "|\\} ",            // Right curly bracket with bar
    
    // Additional mathematical symbols
    "U+2026": "\\ldots ",         // Horizontal ellipsis
    "U+2205": "\\emptyset ",      // Empty set
    "U+221D": "\\propto ",        // Proportional to
    "U+2220": "\\angle ",         // Angle
    "U+2221": "\\measuredangle ", // Measured angle
    "U+2222": "\\sphericalangle ", // Spherical angle
    "U+222E": "\\oint ",          // Contour integral
    "U+2231": "\\oiint ",         // Surface integral
    "U+2232": "\\oiiint ",        // Volume integral
    "U+2236": "\\ratio ",         // Ratio
    "U+2238": "\\dotminus ",      // Dot minus
    "U+2239": "\\excess ",        // Excess
    "U+223A": "\\mbox{$\bm\mathrm{m}$} ", // Geometric proportion
    "U+223B": "\\homothetic ",    // Homothetic
    "U+223D": "\\backsim ",       // Reversed tilde
    "U+223E": "\\lazysinv ",      // Inverted lazy s
    "U+2240": "\\wr ",            // Wreath product
    "U+2241": "\\nsim ",          // Not tilde
    "U+2242": "\\eqsim ",         // Minus tilde
    "U+2246": "\\approxeq ",      // Approximately but not actually equal to
    "U+224F": "\\bumpeq ",        // Difference between
    "U+2251": "\\Doteq ",         // Geometrically equal to
    "U+2258": "\\qed ",           // Corresponds to
    "U+2259": "\\stackrel{?}{=} ", // Estimates
    "U+225A": "\\stackrel{!}{=} ", // Equiangular to
    "U+225B": "\\stackrel{*}{=} ", // Star equals
    "U+225E": "\\stackrel{m}{=} ", // Measured by
    "U+2260": "\\neq ",           // Not equal to
    "U+226C": "\\between ",       // Between
    "U+2295": "\\oplus ",         // Circled plus
    "U+2296": "\\ominus ",        // Circled minus
    "U+2297": "\\otimes ",        // Circled times
    "U+2298": "\\oslash ",        // Circled division slash
    "U+2299": "\\odot ",          // Circled dot operator
    "U+229A": "\\circledcirc ",   // Circled ring operator
    "U+229B": "\\circledast ",    // Circled asterisk operator
    "U+229D": "\\circleddash ",   // Circled dash
    "U+229E": "\\boxplus ",       // Squared plus
    "U+229F": "\\boxminus ",      // Squared minus
    "U+22A0": "\\boxtimes ",      // Squared times
    "U+22A1": "\\boxdot ",        // Squared dot operator
    "U+22A2": "\\vdash ",         // Right tack
    "U+22A3": "\\dashv ",         // Left tack
    "U+22A8": "\\models ",        // True
    "U+22A9": "\\vDash ",         // Forces
    "U+22AA": "\\Vdash ",         // Triple vertical bar right turnstile
    "U+22AB": "\\VDash ",         // Double vertical bar double right turnstile
    "U+22B2": "\\triangleleft ",  // Normal subgroup of
    "U+22B3": "\\triangleright ", // Contains as normal subgroup
    "U+22B4": "\\trianglelefteq ", // Normal subgroup of or equal to
    "U+22B5": "\\trianglerighteq ", // Contains as normal subgroup or equal to
    "U+22B8": "\\multimap ",      // Multimap
    "U+22C0": "\\bigwedge ",      // N-ary logical and
    "U+22C1": "\\bigvee ",        // N-ary logical or
    "U+22C2": "\\bigcap ",        // N-ary intersection
    "U+22C3": "\\bigcup ",        // N-ary union
    "U+22C6": "\\star ",          // Star operator
    "U+22C7": "\\divideontimes ", // Division times
    "U+22C8": "\\bowtie ",        // Bowtie
    "U+22C9": "\\ltimes ",        // Left normal factor semidirect product
    "U+22CA": "\\rtimes ",        // Right normal factor semidirect product
    "U+22CB": "\\leftthreetimes ", // Left semidirect product
    "U+22CC": "\\rightthreetimes ", // Right semidirect product
    "U+22CE": "\\curlyvee ",      // Curly logical or
    "U+22CF": "\\curlywedge ",    // Curly logical and
    "U+22D0": "\\Subset ",        // Double subset
    "U+22D1": "\\Supset ",        // Double superset
    "U+22D2": "\\Cap ",           // Double intersection
    "U+22D3": "\\Cup ",           // Double union
    "U+22D8": "\\lll ",           // Very much less than
    "U+22D9": "\\ggg ",           // Very much greater than
    "U+22DA": "\\lesseqgtr ",     // Less than, equal to, or greater than
    "U+22DB": "\\gtreqless ",     // Greater than, equal to, or less than
    
    // Special function domains
    "U+1D53D": "\\mathbb{F} ",    // Mathematical double-struck capital F (finite field)
    "U+1D544": "\\mathbb{M} ",    // Mathematical double-struck capital M (matrices)
    "U+1D54A": "\\mathbb{S} ",    // Mathematical double-struck capital S (sphere)
    "U+1D54B": "\\mathbb{T} ",    // Mathematical double-struck capital T (torus)
    
    // Miscellaneous technical symbols
    "U+2300": "\\diameter ",      // Diameter sign
    "U+2302": "\\house ",         // House
    "U+2310": "\\invnot ",        // Reversed not sign
    "U+2320": "\\top ",           // Top half integral
    "U+2321": "\\bot ",           // Bottom half integral
    "U+2322": "\\frown ",         // Frown
    "U+2323": "\\smile ",         // Smile
    
    // Subscript and superscript digits
    "U+2070": "^{0} ", "U+00B9": "^{1} ", "U+00B2": "^{2} ", "U+00B3": "^{3} ",
    "U+2074": "^{4} ", "U+2075": "^{5} ", "U+2076": "^{6} ", 
    "U+2077": "^{7} ", "U+2078": "^{8} ", "U+2079": "^{9} ",
    "U+2080": "_{0} ", "U+2081": "_{1} ", "U+2082": "_{2} ", "U+2083": "_{3} ",
    "U+2084": "_{4} ", "U+2085": "_{5} ", "U+2086": "_{6} ",
    "U+2087": "_{7} ", "U+2088": "_{8} ", "U+2089": "_{9} ",

    

        
    
};

// Add a helper function to identify function names
window.identifyFunctionName = function(chars) {
    const functionName = chars.join('');
    const functionMap = {
        'cos': '\\cos',
        'sin': '\\sin',
        'tan': '\\tan',
        'arcsin': '\\arcsin',
        'arccos': '\\arccos',
        'arctan': '\\arctan',
        'sinh': '\\sinh',
        'cosh': '\\cosh',
        'tanh': '\\tanh',
        'log': '\\log',
        'ln': '\\ln',
        'lim': '\\lim',
        'max': '\\max',
        'min': '\\min',
        'sup': '\\sup',
        'inf': '\\inf',
        'det': '\\det',
        'exp': '\\exp',
        'arg': '\\arg',
        'gcd': '\\gcd',
        'csc': '\\csc',
        'sec': '\\sec',
        'cot': '\\cot'
    };
    
    return functionMap[functionName] || null;
};
