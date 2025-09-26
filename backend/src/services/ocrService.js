const Tesseract = require('tesseract.js');
const sharp = require('sharp');

class OCRService {
  /**
   * Enhanced image preprocessing for better OCR accuracy
   */
  static async preprocessImage(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Adaptive preprocessing based on image characteristics
      let pipeline = image
        .grayscale()
        .normalize({ upper: 95 }) // More aggressive contrast
        .linear(1.1, 0) // Brightness boost
        .sharpen({ sigma: 1.2, m1: 1, m2: 2 }); // Enhanced sharpening

      // Resize only if image is too large or too small
      if (metadata.width > 3000 || metadata.height > 3000) {
        pipeline = pipeline.resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        });
      } else if (metadata.width < 500 || metadata.height < 500) {
        pipeline = pipeline.resize(1000, 1000, {
          fit: 'inside',
          withoutEnlargement: false
        });
      }

      // Adaptive thresholding based on image characteristics
      const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
      
      // Calculate optimal threshold using Otsu's method
      const threshold = await this.calculateOptimalThreshold(data);
      
      return await sharp(data, { raw: info })
        .threshold(threshold)
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return imageBuffer; // Return original if preprocessing fails
    }
  }

  /**
   * Calculate optimal threshold using Otsu's method
   */
  static async calculateOptimalThreshold(imageData) {
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < imageData.length; i++) {
      histogram[imageData[i]]++;
    }
    
    // Otsu's method implementation
    let total = imageData.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      
      let mB = sumB / wB;
      let mF = (sum - sumB) / wF;
      
      let variance = wB * wF * (mB - mF) * (mB - mF);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }
    
    return Math.max(128, Math.min(200, threshold)); // Constrain threshold
  }

  

  /**
   * Extract text from image or return text as is
   */
  static async extractText(input) {
    try {
      if (Buffer.isBuffer(input)) {
        const processedImage = await this.preprocessImage(input);
        
        const { data } = await Tesseract.recognize(processedImage, 'eng', {
          logger: m => process.env.NODE_ENV === 'development' && console.log(m.status),
          tessedit_char_whitelist: '0123456789.,%$€£¥₹RsINRUSDabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ',
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6', // Uniform block of text
          tessedit_ocr_engine_mode: '3', // Default, based on what is available
          textord_tabfind_vertical_text: '0',
          textord_space_size_is_variable: '1',
          textord_debug_tabfind: '0',
          tessedit_create_hocr: '0',
          tessedit_create_tsv: '0',
          tessedit_create_pdf: '0',
          // Additional financial document optimizations
          tessedit_do_invert: '0',
          textord_min_linesize: '2.0',
          textord_old_baselines: '0',
          textord_old_xheight: '0',
          textord_min_xheight: '8',
          textord_force_make_prop_words: 'F',
          textord_heavy_nr: '1',
          textord_show_final_blobs: '0',
          // Currency and number recognition
          classify_enable_learning: '0',
          classify_enable_adaptive_matcher: '0',
          textord_really_old_xheight: '1'
        });
        
        return this.postProcessText(data.text);
      }
      
      return input.toString();
    } catch (error) {
      console.error('OCR Processing Error:', error);
      return '';
    }
  }

  /**
   * Post-process OCR text to fix common errors
   */
  static postProcessText(text) {
    if (!text) return '';
    
    return text
      // Fix common OCR errors
      .replace(/\b([Il])([0-9])/g, '1$2') // I/l before numbers -> 1
      .replace(/([0-9])([Oo])\b/g, '$10') // O/o after numbers -> 0
      .replace(/\bB(\d)/g, '8$1') // B before numbers -> 8
      .replace(/(\d)S\b/g, '$15') // S after numbers -> 5
      .replace(/\bG(\d)/g, '6$1') // G before numbers -> 6
      .replace(/\bZ(\d)/g, '2$1') // Z before numbers -> 2
      .replace(/\bS(\d)/g, '5$1') // S before numbers -> 5
      // Normalize spaces around currency symbols
      .replace(/\s*([$€£¥₹])\s*/g, '$1')
      // Fix decimal points and thousand separators
      .replace(/(\d)[,.](\d{3})/g, '$1$2') // Remove thousand separators
      .replace(/(\d),(\d{2}\b)/g, '$1.$2') // Fix decimal commas
      // Fix common OCR mistakes in financial terms
      .replace(/\b(?:totai|totai|totai)\b/gi, 'total')
      .replace(/\b(?:paii|paii|paii)\b/gi, 'paid')
      .replace(/\b(?:due|due|due)\b/gi, 'due')
      .replace(/\b(?:amount|amount|amount)\b/gi, 'amount')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

}

module.exports = OCRService;