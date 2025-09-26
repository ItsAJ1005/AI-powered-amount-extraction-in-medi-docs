const OCRService = require('./ocrService');
const LLMService = require('./llmService');

// Singleton instance with lazy initialization
let llmServiceInstance = null;

class PipelineService {
  static async getLLMService() {
    if (!llmServiceInstance) {
      llmServiceInstance = new LLMService();
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return llmServiceInstance;
  }

  /**
   * Enhanced pipeline with better error handling and logging
   */
  static async process(input) {
    const startTime = Date.now();
    let pipelineStage = 'start';
    let text = '';
    
    try {
      pipelineStage = 'text_extraction';
      console.log('🔧 Starting pipeline processing...');
      
      // 1. Extract text using OCR or use input text
      text = await OCRService.extractText(input);
      
      if (!text.trim()) {
        console.log('📭 No text extracted from input');
        return {
          status: 'no_amounts_found',
          reason: 'no text content',
    
        };
      }

      console.log(`📝 Extracted text length: ${text.length} characters`);
      
      // 2. Get LLM service instance
      const llmService = await this.getLLMService();
      
      pipelineStage = 'llm_processing';
      // 3. Process with LLM for structured extraction
      const llmResult = await llmService.processDocument(text);

      
      // 4. Validate and format the response
      if (llmResult.status === 'no_amounts_found' || !llmResult.amounts?.length) {
        console.log('💰 No amounts found in document');
        
        // Try fallback regex extraction
        const fallbackResult = this._extractAmountsWithRegex(text);
        if (fallbackResult.amounts.length > 0) {
          console.log(`🔄 Using fallback extraction, found ${fallbackResult.amounts.length} amounts`);
          return {
            currency: fallbackResult.currency || 'INR',
            amounts: fallbackResult.amounts,
            status: 'ok'
          };
        }
        
        return { 
          status: 'no_amounts_found',
          reason: 'document too noisy',
          currency: llmResult.currency || 'INR',
          amounts: []
        };
      }

      console.log(`✅ Pipeline completed successfully. Found ${llmResult.amounts.length} amounts`);

      return {
        currency: llmResult.currency || 'INR',
        amounts: llmResult.amounts || [],
        status: llmResult.status || 'ok'
      };
      
    } catch (error) {
      console.error(`💥 Pipeline error at stage ${pipelineStage}:`, error);
      
      // Try fallback extraction on error
      if (pipelineStage === 'llm_processing' && text) {
        console.log('🔄 LLM failed, trying fallback extraction...');
        try {
          const fallbackResult = this._extractAmountsWithRegex(text);
          if (fallbackResult.amounts.length > 0) {
            console.log(`🔄 Fallback extraction found ${fallbackResult.amounts.length} amounts`);
            return {
              currency: fallbackResult.currency || 'INR',
              amounts: fallbackResult.amounts,
              status: 'ok'
            };
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }
      }
      
      return {
        currency: 'INR',
        amounts: [],
        status: 'error'
      };
    }
  }

  /**
   * Fallback regex-based amount extraction
   */
  static _extractAmountsWithRegex(text) {
    if (!text || typeof text !== 'string') {
      return { currency: 'INR', amounts: [], status: 'error' };
    }

    // Enhanced patterns for financial amounts
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

    // Simple currency detection - prioritize INR for medical documents
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
      currency = 'JPY';
    }

    // Debug: Log the text being processed
    console.log('🔍 Processing text:', text.substring(0, 1000) + '...');
    
    // Extract amounts using patterns
    for (const [type, typePatterns] of Object.entries(patterns)) {
      for (const pattern of typePatterns) {
        const regex = new RegExp(pattern, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          try {
            // Extract and clean the amount
            let amountStr = match[1] || '';
            amountStr = amountStr.replace(/[^\d.-]/g, '');
            const value = parseFloat(amountStr);
            
            if (!isNaN(value) && value > 0 && !foundValues.has(value)) {
              foundValues.add(value);
              
              // Convert source text if we detected OCR error
              let sourceText = match[0].trim();
              if (currency === 'INR' && (sourceText.includes('¥') || sourceText.includes('$'))) {
                sourceText = sourceText.replace(/[¥$]/g, '₹');
              }
              
              console.log(`✅ Found ${type}: ${value} from "${sourceText}"`);
              
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
    
    console.log(`📊 Pattern matching found ${amounts.length} amounts`);
    
    // Fallback: Extract all currency amounts and assign types by value
    if (amounts.length === 0) {
      console.log('🔄 No pattern matches found, trying currency extraction...');
      // More comprehensive currency amount patterns
      const currencyAmountPatterns = [
        /([$€£¥₹%])\s*(\d[\d,.]*\d*)/g,
        /(?:usd|inr|eur|gbp|jpy)\s*[:\-\.]\s*(\d[\d,.]*\d*)/gi,
        /(\d[\d,.]*\d*)\s*([$€£¥₹%])/g,
        // Keyword-number fallback without punctuation
        /\b(?:total|subtotal|amount|bill|net)\b\s+(\d[\d,.]*\d*)/gi
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
      
      // Sort by value and assign types
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
        /(\d[\d,.]*\d*)\s*([$€£¥₹%])/g
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

    // Sort by value (highest first)
    amounts.sort((a, b) => b.value - a.value);

    return {
      currency,
      amounts,
      status: amounts.length > 0 ? 'ok' : 'no_amounts_found'
    };
  }

}

module.exports = PipelineService;