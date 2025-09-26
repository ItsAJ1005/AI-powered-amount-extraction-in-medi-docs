// Sample test data for different scenarios

// Clean input with clear amounts
const cleanInput = {
  text: `Medical Bill
---------\nConsultation: $100\nMedicines: $50\nTotal: $150\nPaid: $100\nDue: $50`,
  expected: {
    currency: 'USD',
    amounts: [
      { type: 'consultation', value: 100, source: 'text: \'Consultation: $100\'' },
      { type: 'medicines', value: 50, source: 'text: \'Medicines: $50\'' },
      { type: 'total_bill', value: 150, source: 'text: \'Total: $150\'' },
      { type: 'paid', value: 100, source: 'text: \'Paid: $100\'' },
      { type: 'due', value: 50, source: 'text: \'Due: $50\'' }
    ]
  }
};

// OCR-corrupted input
const ocrCorruptedInput = {
  text: `M3d1c4l B1ll\n---------\nC0n5ult4t10n: $l00\nM3d1c1n35: $5O\nT0t4l: $l5O\nP41d: $lOO\nDu3: $5O`,
  expected: cleanInput.expected // Same expected output after normalization
};

// Noisy input with no clear amounts
const noisyInput = {
  text: 'This is just some random text without any clear monetary amounts.',
  expected: {
    status: 'no_amounts_found',
    reason: 'document too noisy'
  }
};

// Empty input
const emptyInput = {
  text: '',
  expected: {
    status: 'no_amounts_found',
    reason: 'document too noisy'
  }
};

module.exports = {
  cleanInput,
  ocrCorruptedInput,
  noisyInput,
  emptyInput
};
