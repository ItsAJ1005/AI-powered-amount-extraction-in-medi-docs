/**
 * Validates if the input is a valid email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if the email is valid
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates if the input is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Validates if the input is a valid date string
 * @param {string} dateString - The date string to validate
 * @returns {boolean} True if the date is valid
 */
export const isValidDate = (dateString) => {
  return !isNaN(Date.parse(dateString));
};

/**
 * Validates if the input is a non-empty string
 * @param {string} str - The string to validate
 * @returns {boolean} True if the string is not empty
 */
export const isNonEmptyString = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * Validates if the input is a valid number
 * @param {any} num - The value to validate
 * @returns {boolean} True if the value is a valid number
 */
export const isValidNumber = (num) => {
  return typeof num === 'number' && !isNaN(num);
};

/**
 * Validates if the input is a positive number
 * @param {any} num - The value to validate
 * @returns {boolean} True if the value is a positive number
 */
export const isPositiveNumber = (num) => {
  return isValidNumber(num) && num > 0;
};
