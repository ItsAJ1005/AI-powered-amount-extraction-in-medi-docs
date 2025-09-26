class NormalizationService {
  static CHAR_SUBSTITUTIONS = {
    'O': '0', 'o': '0', 'l': '1', 'I': '1', 'B': '8',
    'S': '5', 'Z': '2', 'G': '6', 'D': '0', ' ': '',
    '|': '1', '!': '1', 'i': '1', 's': '5', 'z': '2'
  };

  static PREFIX_PATTERNS = /^[\s₹$€£¥]*(?:Rs\.?|INR|USD|EUR|GBP|JPY)?[\s$€£¥]*(?:amount|total|amt\.?)?\s*[:=-]?\s*/i;
  static SUFFIX_PATTERNS = /[\s%$€£¥]*(?:\b(?:only|approx|approximately|rounded)\b)?$/i;

  /**
   * Enhanced token normalization with better confidence calculation
   */
  static normalizeTokens(rawTokens) {
    if (!rawTokens?.length) {
      return { 
        normalized_amounts: [], 
        normalization_confidence: 0,
        substitutions: [],
        warnings: []
      };
    }

    const result = {
      normalized_amounts: [],
      normalization_confidence: 1.0,
      substitutions: [],
      warnings: []
    };

    for (const token of rawTokens) {
      try {
        // Skip non-numeric tokens early
        if (!this.looksLikeNumber(token)) {
          result.warnings.push(`Token doesn't look like number: ${token}`);
          continue;
        }

        const normalized = this.normalizeToken(token);
        
        if (normalized !== null) {
          result.normalized_amounts.push(normalized.value);
          
          if (normalized.changes > 0 || normalized.warnings.length > 0) {
            result.substitutions.push({
              original: token,
              normalized: normalized.value.toString(),
              changes: normalized.changes,
              warnings: normalized.warnings
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to normalize token: ${token}`, error);
        result.warnings.push(`Failed to normalize: ${token}`);
      }
    }

    result.normalization_confidence = this.calculateConfidence(result);
    return result;
  }

  /**
   * Check if token looks like a number
   */
  static looksLikeNumber(token) {
    if (!token || typeof token !== 'string') return false;
    
    const clean = token.replace(/[^\d.,$€£¥₹]/g, '');
    if (clean.length < 1) return false;
    
    // Should contain at least one digit
    return /\d/.test(clean);
  }

  /**
   * Enhanced token normalization
   */
  static normalizeToken(token) {
    if (!token) return null;
    
    let changes = 0;
    const warnings = [];
    let cleanToken = token.trim();
    
    const original = cleanToken;
    
    // Remove prefixes and suffixes
    cleanToken = cleanToken
      .replace(this.PREFIX_PATTERNS, '')
      .replace(this.SUFFIX_PATTERNS, '');
    
    if (cleanToken !== original) {
      changes++;
    }
    
    // Apply character substitutions with context awareness
    let normalizedStr = '';
    for (let i = 0; i < cleanToken.length; i++) {
      const char = cleanToken[i];
      let replacement = this.CHAR_SUBSTITUTIONS[char] || char;
      
      // Context-aware substitutions
      if (replacement !== char) {
        // Don't substitute if it's part of a currency symbol
        if (i > 0 && /[$€£¥₹]/.test(cleanToken[i-1])) {
          replacement = char;
          warnings.push(`Preserved '${char}' after currency symbol`);
        } else {
          changes++;
        }
      }
      normalizedStr += replacement;
    }
    
    // Enhanced cleaning
    normalizedStr = normalizedStr
      .replace(/[^\d.,-]/g, '') // Keep digits, dots, commas, minus
      .replace(/(\d)-(\d)/g, '$1$2') // Remove dashes between numbers
      .replace(/^[.,]+|[.,]+$/g, ''); // Remove leading/trailing separators
    
    // Handle thousand separators more intelligently
    const commaCount = (normalizedStr.match(/,/g) || []).length;
    const dotCount = (normalizedStr.match(/\./g) || []).length;
    
    if (commaCount > 0 && dotCount > 0) {
      // If both commas and dots, assume commas are thousand separators
      normalizedStr = normalizedStr.replace(/,/g, '');
    } else if (commaCount > 0) {
      // If only commas, check if they're likely decimal or thousand separators
      if (normalizedStr.includes(',') && normalizedStr.split(',')[1]?.length === 2) {
        // Looks like European decimal format
        normalizedStr = normalizedStr.replace(',', '.');
      } else {
        // Assume thousand separators
        normalizedStr = normalizedStr.replace(/,/g, '');
      }
    }
    
    // Final cleanup
    normalizedStr = normalizedStr.replace(/(\d)\.(?=\d{3})/g, '$1'); // Remove dots used as thousand separators
    
    // Validate the result
    const number = parseFloat(normalizedStr);
    if (isNaN(number)) {
      warnings.push(`Resulting string '${normalizedStr}' is not a valid number`);
      return null;
    }
    
    // Check for reasonable values
    if (Math.abs(number) > 1000000000) { // 1 billion
      warnings.push(`Suspiciously large value: ${number}`);
    }
    
    return {
      value: number,
      changes: changes,
      warnings: warnings
    };
  }

  /**
   * Improved confidence calculation
   */
  static calculateConfidence(result) {
    if (!result.normalized_amounts.length) return 0;
    
    const totalChanges = result.substitutions.reduce(
      (sum, sub) => sum + sub.changes, 0
    );
    
    const totalWarnings = result.substitutions.reduce(
      (sum, sub) => sum + (sub.warnings?.length || 0), 0
    );
    
    const avgChanges = totalChanges / result.normalized_amounts.length;
    const avgWarnings = totalWarnings / result.normalized_amounts.length;
    
    let confidence = 1.0 - (avgChanges * 0.15) - (avgWarnings * 0.1);
    confidence = Math.max(0.1, Math.min(1.0, confidence));
    
    return parseFloat(confidence.toFixed(2));
  }
}

module.exports = NormalizationService;