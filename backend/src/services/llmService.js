const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    this.initialized = false;
    this.useLLM = false;
    this.init();
  }

  async init() {
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey || apiKey === 'your_gemini_api_key') {
        throw new Error('No valid GEMINI_API_KEY found in environment variables');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.useLLM = true;
      
      
      this.primaryModelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      this.fallbackModelName = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-pro';
      
      this.generationConfig = {
        temperature: 0.1,    // Lower temperature for more consistent results
        topK: 10,
        topP: 0.8,
        maxOutputTokens: 512, // Reduced for faster response
      };
      
      this.initialized = true;
      console.log(`✅ LLM Service: Initialized with ${this.primaryModelName} (fallback: ${this.fallbackModelName})`);
    } catch (error) {
      console.warn('❌ LLM Service: Falling back to regex-only mode:', error.message);
      this.useLLM = false;
      this.initialized = true;
    }
  }


  /**
   * Improved retry logic with exponential backoff
   */
  async _generateWithRetry(prompt, options = {}) {
    if (!this.useLLM || !this.initialized) {
      throw new Error('LLM processing is disabled or not initialized');
    }

    const { 
      attemptsPerModel = 3, 
      initialBackoffMs = 1000,
      maxBackoffMs = 10000 
    } = options;

    const models = [
      { name: this.primaryModelName, config: this.generationConfig },
      { name: this.fallbackModelName, config: this.generationConfig }
    ];

    let lastError;

    for (const { name, config } of models) {
      for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
        try {
          console.log(`🔹 Attempting with ${name} (attempt ${attempt}/${attemptsPerModel})`);
          
          const model = this.genAI.getGenerativeModel({ 
            model: name, 
            generationConfig: config 
          });

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          if (!text?.trim()) {
            throw new Error('Received empty response from AI');
          }
          
          return text;
        } catch (error) {
          lastError = error;
          const errorMsg = error.message.toLowerCase();
          
          // Check if this is a retryable error
          const isRetryable = this._isRetryableError(errorMsg);
          
          if (isRetryable && attempt < attemptsPerModel) {
            const backoffTime = this._calculateBackoff(attempt, initialBackoffMs, maxBackoffMs);
            console.warn(`⏳ Retryable error: ${errorMsg}. Retrying in ${backoffTime}ms...`);
            await this._sleep(backoffTime);
            continue;
          }
          
          console.warn(`❌ Attempt ${attempt} failed with ${name}:`, error.message);
          break;
        }
      }
    }
    
    throw lastError || new Error('All model attempts failed');
  }

  /**
   * Check if error is retryable
   */
  _isRetryableError(errorMessage) {
    const retryablePatterns = [
      '429', 'quota', 'rate limit', 'too many requests',
      'unavailable', 'temporarily', 'service unavailable',
      'timeout', 'gateway', 'internal error'
    ];
    
    return retryablePatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
  }

  /**
   * Calculate exponential backoff with jitter
   */
  _calculateBackoff(attempt, initialBackoffMs, maxBackoffMs) {
    const exponentialBackoff = Math.min(
      initialBackoffMs * Math.pow(2, attempt - 1),
      maxBackoffMs
    );
    
    // Add jitter to avoid thundering herd problem
    const jitter = Math.random() * 0.3 * exponentialBackoff;
    return Math.min(exponentialBackoff + jitter, maxBackoffMs);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced document processing with better prompt engineering
   */
  async processDocument(text) {
    // Wait for initialization if needed
    if (!this.initialized) {
      await this.init();
    }

    const textToProcess = text?.text || text || '';

    // Enhanced input validation
    if (!textToProcess.trim()) {
      return this._createResponse('INR', [], 'no_content');
    }

    // Better noise detection
    if (this._isNoisyText(textToProcess)) {
      return this._createResponse('INR', [], 'noisy_content');
    }

    // Use regex fallback for very short texts
    if (textToProcess.length < 20) {
      console.log('📝 Using regex for short text');
      return this.extractAmountsWithRegex(textToProcess);
    }

    if (!this.useLLM) {
      console.log('🔍 Using regex fallback (LLM disabled)');
      return this.extractAmountsWithRegex(textToProcess);
    }

    try {
      console.log('🤖 Processing document with LLM');
      const prompt = this._buildPrompt(textToProcess);
      const responseText = await this._generateWithRetry(prompt);

      return this._parseLLMResponse(responseText, textToProcess);
    } catch (error) {
      console.error('💥 LLM processing failed:', error.message);
      return this.extractAmountsWithRegex(textToProcess);
    }
  }

  /**
   * Build optimized prompt for financial extraction
   */
  _buildPrompt(text) {
    return `Extract financial amounts from this medical document. Return ONLY valid JSON:

{
  "currency": "INR",
  "amounts": [
    {"type": "total_bill", "value": 1200, "source": "Total: INR 1200"},
    {"type": "paid", "value": 1000, "source": "Paid: 1000"},
    {"type": "due", "value": 200, "source": "Due: 200"}
  ],
  "status": "ok"
}

RULES:
1. Currency: Use INR unless clearly specified otherwise
2. Types: Only use "total_bill", "paid", "due"
3. Values: Whole numbers only, remove symbols/commas
4. Source: Keep original text snippet
5. Status: "ok" if amounts found, "no_amounts_found" otherwise

DOCUMENT:
${text.substring(0, 20000)}`;
  }

  /**
   * Improved response parsing with better error handling
   */
  _parseLLMResponse(responseText, originalText) {
    try {
      // Clean and extract JSON
      const jsonStr = this._extractJSON(responseText);
      const result = JSON.parse(jsonStr);

      // Validate structure
      if (!result.currency || !Array.isArray(result.amounts)) {
        throw new Error('Invalid response structure');
      }

      // Normalize amounts
      const normalizedAmounts = this._normalizeAmounts(result.amounts);
      
      return {
        currency: result.currency.toUpperCase() || 'INR',
        amounts: normalizedAmounts,
        status: normalizedAmounts.length > 0 ? 'ok' : 'no_amounts_found',
        source: 'llm'
      };
    } catch (error) {
      console.warn('❌ LLM JSON parse error:', error.message);
      return this.extractAmountsWithRegex(originalText);
    }
  }

  /**
   * Extract JSON from response text
   */
  _extractJSON(text) {
    let jsonStr = text.trim();
    
    // Remove code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Find JSON object - be more flexible with matching
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found');
    }
    
    let cleanedJson = jsonMatch[0];
    
    // More robust JSON cleaning
    cleanedJson = cleanedJson
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":') // Ensure proper JSON keys
      .replace(/:\s*([^",\][}{]+?)(?=\s*[,}\]])/g, (match, value) => {
        // Only wrap unquoted values that aren't already numbers or booleans
        const trimmedValue = value.trim();
        if (/^(true|false|null|\d+(\.\d+)?)$/.test(trimmedValue)) {
          return `: ${trimmedValue}`;
        }
        return `: "${trimmedValue}"`;
      })
      .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']'); // Remove trailing commas before closing brackets
    
    return cleanedJson;
  }

  /**
   * Normalize amount values
   */
  _normalizeAmounts(amounts) {
    return amounts
      .filter(amount => amount && amount.type && amount.value != null)
      .map(amount => ({
        type: amount.type.toLowerCase(),
        value: Math.round(Math.abs(parseFloat(amount.value) || 0)),
        source: amount.source || `text: '${amount.type}: ${amount.value}'`
      }))
      .filter(amount => amount.value > 0); // Remove zero amounts
  }

  /**
   * Check if text is too noisy for LLM processing
   */
  _isNoisyText(text) {
    const cleanText = text.replace(/\s+/g, '');
    if (cleanText.length < 10) return true;
    
    const digitRatio = (text.replace(/\D/g, '').length) / text.length;
    const specialCharRatio = (text.replace(/[a-zA-Z0-9\s]/g, '').length) / text.length;
    
    return digitRatio > 0.5 || specialCharRatio > 0.6;
  }

  _createResponse(currency, amounts, status) {
    return {
      currency: currency || 'INR',
      amounts: amounts || [],
      status: status || 'ok',
      source: 'regex'
    };
  }

  /**
   * Fallback regex extraction when LLM fails
   */
  extractAmountsWithRegex(text) {
    if (!text || typeof text !== 'string') {
      return this._createResponse('INR', [], 'error');
    }

    // Enhanced regex patterns for amount extraction
    const patterns = {
      total_bill: [
        /(?:total|grand\s*total|final\s*amount|net\s*amount|bill\s*amount)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:amount|total)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:subtotal|sub\s*total)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:total)\s*,\s*(?:usd|inr|eur|gbp|jpy)\s*:\s*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        // No punctuation variant e.g., "Total 2000"
        /\b(?:total|subtotal|amount)\b\s+([$€£¥₹]?\s*\d[\d,.]*\d*)/i
      ],
      paid: [
        /(?:paid|amount\s*paid|received|payment\s*made|amt\s*paid)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:paid)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:amount\s*paid)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:amount\s*paid)\s*,\s*(?:usd|inr|eur|gbp|jpy)\s*\.\s*([$€£¥₹]?\s*\d[\d,.]*\d*)/i
      ],
      due: [
        /(?:due|balance\s*due|amount\s*due|pending|balance|payable|outstanding)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:due)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:balance\s*due)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:balance\s*due)\s*,\s*(?:usd|inr|eur|gbp|jpy)\s*:\s*([$€£¥₹]?\s*\d[\d,.]*\d*)/i
      ],
      tax: [
        /(?:tax|sales\s*tax|gst|vat|sgst|cgst|igst|service\s*tax)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:tax)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:sales\s*tax)\s*,\s*(?:usd|inr|eur|gbp|jpy)\s*:\s*([$€£¥₹]?\s*\d[\d,.]*\d*)/i
      ],
      discount: [
        /(?:discount|disc)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:discount)\s*,\s*(?:usd|inr|eur|gbp|jpy)\s*\.\s*([$€£¥₹]?\s*\d[\d,.]*\d*)/i
      ],
      shipping: [
        /(?:shipping|shipping\s*cost|delivery)\s*[:\-=>]+\s*[^\d]*([$€£¥₹]?\s*\d[\d,.]*\d*)/i,
        /(?:shipping\s*cost)\s*,\s*(?:usd|inr|eur|gbp|jpy)\s*\.\s*([$€£¥₹]?\s*\d[\d,.]*\d*)/i
      ]
    };

    const amounts = [];
    const foundValues = new Set();
    let currency = 'INR';

    // Simple currency detection
    if (text.includes('₹') || text.includes('Rs') || text.includes('INR') || 
        text.includes('rupees') || text.includes('rupee')) {
      currency = 'INR';
    } else if (text.includes('$') || text.includes('USD')) {
      currency = 'USD';
    } else if (text.includes('€') || text.includes('EUR')) {
      currency = 'EUR';
    } else if (text.includes('£') || text.includes('GBP')) {
      currency = 'GBP';
    } else if (text.includes('¥') || text.includes('JPY')) {
      currency = 'INR';
    }

    // Extract amounts using patterns
    for (const [type, typePatterns] of Object.entries(patterns)) {
      for (const pattern of typePatterns) {
        const regex = new RegExp(pattern, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          try {
            let amountStr = match[1] || '';
            amountStr = amountStr.replace(/[^\d.-]/g, '');
            const value = parseFloat(amountStr);
            
            if (!isNaN(value) && value > 0 && !foundValues.has(value)) {
              foundValues.add(value);
              
              let sourceText = match[0].trim();
              if (currency === 'INR' && (sourceText.includes('¥') || sourceText.includes('$'))) {
                sourceText = sourceText.replace(/[¥$]/g, '₹');
              }
              
              amounts.push({
                type,
                value: Math.round(value),
                source: `text: '${sourceText}'`
              });
            }
          } catch (e) {
            console.warn('Error processing amount match:', e);
          }
        }
      }
    }

    // Debug: Log the text being processed
    console.log('🔍 LLM Processing text:', text.substring(0, 500) + '...');
    
    // Fallback: Extract all currency amounts
    if (amounts.length === 0) {
      console.log('🔄 No pattern matches found, trying currency extraction...');
      // More comprehensive currency amount patterns
      const currencyAmountPatterns = [
        /([$€£¥₹%])\s*(\d[\d,.]*\d*)/g,
        /(?:usd|inr|eur|gbp|jpy)\s*[:\-\.]\s*(\d[\d,.]*\d*)/gi,
        /(\d[\d,.]*\d*)\s*([$€£¥₹%])/g
      ];
      
      const foundAmounts = [];
      
      for (const pattern of currencyAmountPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          let amountStr;
          if (pattern.source.includes('(?:usd|inr|eur|gbp|jpy)')) {
            // For currency: amount format
            amountStr = match[1];
          } else if (pattern.source.includes('(\\d[\\d,.]*\\d*)\\s*([$€£¥₹%])')) {
            // For amount currency format
            amountStr = match[1];
          } else {
            // For currency amount format
            amountStr = match[2];
          }
          
          amountStr = amountStr.replace(/[^\d.-]/g, '');
          const value = parseFloat(amountStr);
          
          if (!isNaN(value) && value > 0) {
            console.log(`💰 Found currency amount: ${value} from "${match[0].trim()}"`);
            foundAmounts.push({
              value: Math.round(value),
              source: match[0].trim()
            });
          }
        }
      }
      
      console.log(`📊 Currency extraction found ${foundAmounts.length} amounts`);
      
      foundAmounts.sort((a, b) => b.value - a.value);
      
      if (foundAmounts.length > 0) {
        amounts.push({
          type: 'total_bill',
          value: foundAmounts[0].value,
          source: `text: '${foundAmounts[0].source}'`
        });
        
        if (foundAmounts.length >= 2) {
          amounts.push({
            type: 'paid',
            value: foundAmounts[1].value,
            source: `text: '${foundAmounts[1].source}'`
          });
        }
        
        if (foundAmounts.length >= 3) {
          amounts.push({
            type: 'due',
            value: foundAmounts[2].value,
            source: `text: '${foundAmounts[2].source}'`
          });
        }
      }
    }
    
    // Additional fallback: Look for all amounts even if some were found
    if (amounts.length < 3) {
      console.log(`🔄 Only found ${amounts.length} amounts, trying comprehensive extraction...`);
      // Use the same comprehensive patterns as above
      const allAmountsPatterns = [
        /([$€£¥₹%])\s*(\d[\d,.]*\d*)/g,
        /(?:usd|inr|eur|gbp|jpy)\s*[:\-\.]\s*(\d[\d,.]*\d*)/gi,
        /(\d[\d,.]*\d*)\s*([$€£¥₹%])/g,
        // Keyword-number fallback without punctuation
        /\b(?:total|subtotal|amount|bill|net)\b\s+(\d[\d,.]*\d*)/gi
      ];
      
      const allAmounts = [];
      
      for (const pattern of allAmountsPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          let amountStr;
          if (pattern.source.includes('(?:usd|inr|eur|gbp|jpy)')) {
            // For currency: amount format
            amountStr = match[1];
          } else if (pattern.source.includes('(\\d[\\d,.]*\\d*)\\s*([$€£¥₹%])')) {
            // For amount currency format
            amountStr = match[1];
          } else {
            // For currency amount format
            amountStr = match[2];
          }
          
          amountStr = amountStr.replace(/[^\d.-]/g, '');
          const value = parseFloat(amountStr);
          
          if (!isNaN(value) && value > 0) {
            console.log(`💰 Found additional amount: ${value} from "${match[0].trim()}"`);
            allAmounts.push({
              value: Math.round(value),
              source: match[0].trim()
            });
          }
        }
      }
      
      console.log(`📊 Comprehensive extraction found ${allAmounts.length} total amounts`);
      
      // Remove duplicates and sort
      const uniqueAmounts = allAmounts.filter((amount, index, self) => 
        index === self.findIndex(a => a.value === amount.value)
      ).sort((a, b) => b.value - a.value);
      
      console.log(`📊 After deduplication: ${uniqueAmounts.length} unique amounts`);
      
      // If we found more amounts than we currently have, replace with all found amounts
      if (uniqueAmounts.length > amounts.length) {
        console.log(`🔄 Replacing ${amounts.length} amounts with ${uniqueAmounts.length} amounts`);
        amounts.length = 0; // Clear existing amounts
        
        if (uniqueAmounts.length >= 1) {
          amounts.push({
            type: 'total_bill',
            value: uniqueAmounts[0].value,
            source: `text: '${uniqueAmounts[0].source}'`
          });
        }
        
        if (uniqueAmounts.length >= 2) {
          amounts.push({
            type: 'paid',
            value: uniqueAmounts[1].value,
            source: `text: '${uniqueAmounts[1].source}'`
          });
        }
        
        if (uniqueAmounts.length >= 3) {
          amounts.push({
            type: 'due',
            value: uniqueAmounts[2].value,
            source: `text: '${uniqueAmounts[2].source}'`
          });
        }
      }
    }

    return {
      currency,
      amounts,
      status: amounts.length > 0 ? 'ok' : 'no_amounts_found'
    };
  }

}

module.exports = LLMService;