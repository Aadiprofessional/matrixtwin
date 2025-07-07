/**
 * Generates a random 6-digit form number
 * @returns A string containing a 6-digit random number
 */
export const generateFormNumber = (): string => {
  // Generate a random number between 100000 and 999999 (6 digits)
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  return randomNumber.toString();
};

/**
 * Generates a prefixed form number with a specific prefix
 * @param prefix - The prefix for the form number (e.g., 'SF' for Safety, 'CL' for Cleansing)
 * @returns A string containing the prefixed form number
 */
export const generatePrefixedFormNumber = (prefix: string): string => {
  const formNumber = generateFormNumber();
  return `${prefix}-${formNumber}`;
};

/**
 * Validates if a form number has the correct 6-digit format
 * @param formNumber - The form number to validate
 * @returns Boolean indicating if the form number is valid
 */
export const validateFormNumber = (formNumber: string): boolean => {
  // Remove any prefix and check if the remaining part is 6 digits
  const numberPart = formNumber.includes('-') 
    ? formNumber.split('-')[1] 
    : formNumber;
  
  return /^\d{6}$/.test(numberPart);
};

/**
 * Form number prefixes for different form types
 */
export const FORM_PREFIXES = {
  SAFETY: 'SF',
  CLEANSING: 'CL', 
  LABOUR: 'LB',
  DIARY: 'DY'
} as const; 