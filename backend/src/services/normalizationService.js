class NormalizationService {
  // Character substitution map for common OCR errors
  static CHAR_SUBSTITUTIONS = {
    'O': '0',
    'o': '0',
    'l': '1',
    'I': '1',
    'B': '8',
    'S': '5',
    'Z': '2',
    ' ': ''
  };

  // Patterns to remove from the beginning or end of strings
  static PREFIX_PATTERNS = /^[\s₹$€£¥]*(Rs\.?|INR|USD|EUR|GBP|JPY)?[\s$€£¥]*/i;
  static SUFFIX_PATTERNS = /[\s%$€£¥]*$/i;

  /**
   * Normalize and clean OCR-extracted tokens
   * @param {string[]} rawTokens - Array of raw token strings
   * @returns {{normalized_amounts: number[], normalization_confidence: number, substitutions: Array<{original: string, normalized: string, changes: number}>}}
   */
  static normalizeTokens(rawTokens) {
    if (!rawTokens || !rawTokens.length) {
      return { 
        normalized_amounts: [], 
        normalization_confidence: 0,
        substitutions: []
      };
    }

    const result = {
      normalized_amounts: [],
      normalization_confidence: 1.0, // Start with full confidence
      substitutions: []
    };

    for (const token of rawTokens) {
      try {
        // Skip percentage values (they're handled separately)
        if (token.includes('%')) {
          continue;
        }

        const normalized = this.normalizeToken(token);
        
        if (normalized !== null) {
          result.normalized_amounts.push(normalized.value);
          
          // Track substitutions for confidence calculation
          if (normalized.changes > 0) {
            result.substitutions.push({
              original: token,
              normalized: normalized.value.toString(),
              changes: normalized.changes
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to normalize token: ${token}`, error);
      }
    }

    // Calculate confidence based on substitutions
    if (result.substitutions.length > 0) {
      const totalChanges = result.substitutions.reduce(
        (sum, sub) => sum + sub.changes, 0
      );
      
      // Reduce confidence by 0.1 per substitution, but not below 0.1
      result.normalization_confidence = Math.max(
        0.1, 
        1.0 - (0.1 * totalChanges)
      );
      
      // Round to 2 decimal places
      result.normalization_confidence = parseFloat(
        result.normalization_confidence.toFixed(2)
      );
    }

    return result;
  }

  /**
   * Normalize a single token
   * @param {string} token - Raw token string
   * @returns {{value: number, changes: number}|null} - Normalized number and number of changes made
   */
  static normalizeToken(token) {
    if (!token) return null;
    
    let changes = 0;
    let cleanToken = token.trim();
    
    // Track original for comparison
    const original = cleanToken;
    
    // Remove prefixes and suffixes
    cleanToken = cleanToken
      .replace(this.PREFIX_PATTERNS, '')
      .replace(this.SUFFIX_PATTERNS, '');
    
    // Apply character substitutions
    let normalizedStr = '';
    for (const char of cleanToken) {
      const replacement = this.CHAR_SUBSTITUTIONS[char] || char;
      if (replacement !== char) changes++;
      normalizedStr += replacement;
    }
    
    // Remove any remaining non-numeric characters except decimal point and minus
    normalizedStr = normalizedStr.replace(/[^\d.-]/g, '');
    
    // Remove thousand separators (commas between digits)
    normalizedStr = normalizedStr.replace(/(\d),(?=\d)/g, '$1');
    
    // Parse to number
    const number = parseFloat(normalizedStr);
    
    // Return null for invalid numbers
    if (isNaN(number)) {
      return null;
    }
    
    return {
      value: number,
      changes: changes
    };
  }
}

// Test with the sample input
function test() {
  const sample = ["l200", "1000", "200", "10%"];
  const result = NormalizationService.normalizeTokens(sample);
  
  console.log('Test Input:', sample);
  console.log('Normalized:', result.normalized_amounts);
  console.log('Confidence:', result.normalization_confidence);
  console.log('Substitutions:', result.substitutions);
  // Expected: [1200, 1000, 200] with confidence based on substitutions
}

// Uncomment to run test
// test();

module.exports = NormalizationService;
