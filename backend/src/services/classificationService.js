class ClassificationService {
  /**
   * Classify amounts based on surrounding text context
   * @param {string} text - Full text from the document
   * @param {number[]} amounts - Array of normalized amounts
   * @returns {{amounts: Array<{type: string, value: number}>, confidence: number}}
   */
  static classifyAmounts(text, amounts) {
    if (!amounts || !amounts.length) {
      return { amounts: [], confidence: 0 };
    }

    // Sort amounts in descending order (common pattern: largest is total)
    const sortedAmounts = [...amounts].sort((a, b) => b - a);
    const textLower = text.toLowerCase();
    
    const classified = sortedAmounts.map((amount, index) => {
      // Default classification based on position (largest amount is likely the total)
      let type = 'other';
      let confidence = 0.5;
      
      if (index === 0 && amounts.length > 1) {
        type = 'total_bill';
        confidence = 0.8;
      } else if (index === 1 && amounts.length > 2) {
        type = 'paid_amount';
        confidence = 0.7;
      } else if (index === amounts.length - 1) {
        type = 'balance_due';
        confidence = 0.6;
      }

      // Look for context around the amount
      const amountStr = amount.toString();
      const amountIndex = textLower.indexOf(amountStr);
      
      if (amountIndex !== -1) {
        // Get surrounding text (20 chars before and after)
        const context = textLower.substring(
          Math.max(0, amountIndex - 20), 
          Math.min(textLower.length, amountIndex + amountStr.length + 20)
        );

        // Check for keywords in context
        const { type: contextType, confidence: contextConfidence } = 
          this.classifyByContext(context);
        
        // If context provides higher confidence, use it
        if (contextConfidence > confidence) {
          type = contextType;
          confidence = contextConfidence;
        }
      }

      return { type, value: amount };
    });

    return {
      amounts: classified,
      confidence: this.calculateOverallConfidence(classified)
    };
  }

  static classifyByContext(context) {
    const patterns = [
      { type: 'total_bill', regex: /total|amt|amount|balance|due|pay/i, confidence: 0.9 },
      { type: 'paid_amount', regex: /paid|received|deposit|advance/i, confidence: 0.85 },
      { type: 'discount', regex: /discount|off|deduction|concession/i, confidence: 0.8 },
      { type: 'tax', regex: /tax|gst|vat|service charge|fee/i, confidence: 0.8 },
      { type: 'insurance', regex: /insurance|claim|tpa|settlement/i, confidence: 0.75 },
      { type: 'other', regex: /./, confidence: 0.5 } // Default fallback
    ];

    for (const { type, regex, confidence } of patterns) {
      if (regex.test(context)) {
        return { type, confidence };
      }
    }

    return { type: 'other', confidence: 0.5 };
  }

  static calculateOverallConfidence(classifiedAmounts) {
    if (!classifiedAmounts.length) return 0;
    
    const totalConfidence = classifiedAmounts.reduce((sum, item) => {
      // Map type to confidence weight (higher for more important types)
      const weights = {
        total_bill: 1.0,
        paid_amount: 0.8,
        balance_due: 0.7,
        tax: 0.6,
        discount: 0.5,
        insurance: 0.5,
        other: 0.3
      };
      
      return sum + (weights[item.type] || 0.3);
    }, 0);

    return parseFloat((totalConfidence / classifiedAmounts.length).toFixed(2));
  }
}

module.exports = ClassificationService;
