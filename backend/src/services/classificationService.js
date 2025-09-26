class ClassificationService {
  // Keyword mapping with weights
  static KEYWORD_MAP = {
    total_bill: {
      keywords: ['total', 'amount', 'bill', 'grand total', 'subtotal'],
      weight: 1.0
    },
    paid: {
      keywords: ['paid', 'payment', 'received', 'deposit', 'advance'],
      weight: 0.9
    },
    due: {
      keywords: ['due', 'balance', 'outstanding', 'payable', 'remaining'],
      weight: 0.9
    },
    discount: {
      keywords: ['discount', 'off', 'deduction', 'concession', 'rebate'],
      weight: 0.8
    },
    tax: {
      keywords: ['tax', 'gst', 'vat', 'service charge', 'fee', 'cess'],
      weight: 0.8
    },
    other: {
      keywords: [],
      weight: 0.5
    }
  };

  /**
   * Classify amounts based on surrounding text context
   * @param {string} text - Full text from the document
   * @param {number[]} amounts - Array of normalized amounts
   * @returns {{
   *   amounts: Array<{type: string, value: number, confidence: number, provenance: string}>,
   *   confidence: number
   * }}
   */
  static classifyAmounts(text, amounts) {
    if (!amounts || !amounts.length) {
      return { amounts: [], confidence: 0 };
    }

    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);
    const amountStrings = amounts.map(String);
    
    const classified = amounts.map(amount => {
      const amountStr = amount.toString();
      const amountIndex = textLower.indexOf(amountStr);
      
      if (amountIndex === -1) {
        return {
          type: 'other',
          value: amount,
          confidence: 0.5,
          provenance: 'No matching text found for amount'
        };
      }

      // Get the exact text around the amount (10 words before and after)
      const wordIndices = this.findWordIndices(textLower, amountStr);
      const contextWords = this.getContextWords(words, wordIndices, 5);
      
      // Find the best matching type based on keywords
      const { type, confidence, match } = this.findBestMatch(contextWords);
      
      // Get the exact text snippet for provenance
      const snippet = this.getTextSnippet(text, amountIndex, 30);
      const provenance = `text: '${snippet.trim()}'`;
      
      return {
        type,
        value: amount,
        confidence,
        provenance
      };
    });

    return {
      amounts: classified,
      confidence: this.calculateOverallConfidence(classified)
    };
  }

  /**
   * Find the indices of all words that make up the amount
   */
  static findWordIndices(text, amountStr) {
    const regex = new RegExp(`\\b${amountStr}\\b`, 'g');
    const indices = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      indices.push(match.index);
    }
    
    return indices;
  }

  /**
   * Get context words around the amount
   */
  static getContextWords(words, indices, windowSize) {
    const context = [];
    
    for (const index of indices) {
      const wordIndex = this.getWordIndexAtPosition(words, index);
      const start = Math.max(0, wordIndex - windowSize);
      const end = Math.min(words.length, wordIndex + windowSize + 1);
      
      context.push(...words.slice(start, end));
    }
    
    return [...new Set(context)]; // Remove duplicates
  }

  /**
   * Find the word index at a given character position
   */
  static getWordIndexAtPosition(words, charIndex) {
    let currentPos = 0;
    
    for (let i = 0; i < words.length; i++) {
      currentPos += words[i].length + 1; // +1 for the space
      if (currentPos > charIndex) {
        return i;
      }
    }
    
    return words.length - 1;
  }

  /**
   * Find the best matching type based on keywords in context
   */
  static findBestMatch(contextWords) {
    let bestMatch = { type: 'other', confidence: 0.5, match: 'No keywords found' };
    
    for (const [type, { keywords, weight }] of Object.entries(this.KEYWORD_MAP)) {
      for (const keyword of keywords) {
        // Check for exact matches first
        if (contextWords.includes(keyword)) {
          return {
            type,
            confidence: weight * 1.0,
            match: `Exact match for '${keyword}'`
          };
        }
        
        // Check for partial matches
        const partialMatch = contextWords.find(word => word.includes(keyword));
        if (partialMatch) {
          const confidence = weight * 0.8;
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              type,
              confidence,
              match: `Partial match: '${partialMatch}' contains '${keyword}'`
            };
          }
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Get a text snippet around the amount
   */
  static getTextSnippet(text, position, length) {
    const start = Math.max(0, position - length);
    const end = Math.min(text.length, position + length);
    
    // Try to find word boundaries
    const snippetStart = text.lastIndexOf(' ', start) + 1;
    const snippetEnd = text.indexOf(' ', end);
    
    return text.slice(snippetStart, snippetEnd === -1 ? text.length : snippetEnd);
  }

  /**
   * Calculate overall confidence score
   */
  static calculateOverallConfidence(classifiedAmounts) {
    if (!classifiedAmounts.length) return 0;
    
    const totalConfidence = classifiedAmounts.reduce((sum, item) => {
      const typeWeight = this.KEYWORD_MAP[item.type]?.weight || 0.5;
      return sum + (item.confidence * typeWeight);
    }, 0);
    
    const average = totalConfidence / classifiedAmounts.length;
    return parseFloat(average.toFixed(2));
  }
}

// Test with sample input
function test() {
  const sampleText = "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%";
  const amounts = [1200, 1000, 200, 10];
  
  const result = ClassificationService.classifyAmounts(sampleText, amounts);
  
  console.log('Test Input:', sampleText);
  console.log('Classified Amounts:');
  result.amounts.forEach(amt => {
    console.log(`- ${amt.value} (${amt.type}): ${amt.confidence.toFixed(2)} - ${amt.provenance}`);
  });
  console.log('Overall Confidence:', result.confidence.toFixed(2));
}

// Uncomment to run test
// test();

module.exports = ClassificationService;
