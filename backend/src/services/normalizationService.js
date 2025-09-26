class NormalizationService {
  /**
   * Normalize and clean OCR-extracted tokens
   * @param {string[]} rawTokens - Array of raw token strings
   * @returns {{normalized_amounts: number[], normalization_confidence: number}}
   */
  static normalizeTokens(rawTokens) {
    if (!rawTokens || !rawTokens.length) {
      return { normalized_amounts: [], normalization_confidence: 0 };
    }

    const normalizedAmounts = [];
    let validCount = 0;

    for (const token of rawTokens) {
      try {
        // Remove all non-numeric characters except decimal point and minus
        let cleanStr = token
          .replace(/[^\d.-]/g, '') // Keep only digits, decimal, and minus
          .replace(/(\d),(?=\d)/g, '$1'); // Remove thousand separators

        // Handle common OCR mistakes
        cleanStr = this.fixCommonOCRerrors(cleanStr);
        
        const amount = parseFloat(cleanStr);
        if (!isNaN(amount)) {
          normalizedAmounts.push(amount);
          validCount++;
        }
      } catch (error) {
        console.warn(`Failed to normalize token: ${token}`, error);
      }
    }

    // Calculate confidence based on how many tokens were successfully normalized
    const normalization_confidence = rawTokens.length > 0 
      ? validCount / rawTokens.length 
      : 0;

    return {
      normalized_amounts: normalizedAmounts,
      normalization_confidence: parseFloat(normalization_confidence.toFixed(2))
    };
  }

  static fixCommonOCRerrors(str) {
    // Common OCR mistakes: O→0, l→1, etc.
    const replacements = {
      'O': '0',
      'o': '0',
      'l': '1',
      'I': '1',
      'B': '8',
      'S': '5',
      'Z': '2',
      ' ': ''
    };

    return str
      .split('')
      .map(char => replacements[char] || char)
      .join('');
  }
}

module.exports = NormalizationService;
