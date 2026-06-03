// src/js/lib/validator.js

class DataValidator {
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static validatePhoneNumber(phone) {
    const re = /^\d{10,11}$/;
    return re.test(String(phone).replace(/\D/g, ''));
  }

  static validateBankCode(code) {
    return /^\d{4}$/.test(String(code));
  }

  static validateAccountNumber(account) {
    return /^\d{7}$/.test(String(account));
  }

  static validateDate(date) {
    return !isNaN(Date.parse(date));
  }

  static validateAmount(amount) {
    const num = Number(amount);
    return !isNaN(num) && num >= 0;
  }

  static validateRequired(value) {
    return value && String(value).trim() !== '';
  }

  static validateRecord(record, schema) {
    const errors = [];

    for (const field in schema) {
      const rules = schema[field];
      const value = record[field];

      if (rules.required && !this.validateRequired(value)) {
        errors.push(`${field} is required`);
      }

      if (rules.type === 'email' && value && !this.validateEmail(value)) {
        errors.push(`${field} must be a valid email`);
      }

      if (rules.type === 'number' && value && !this.validateAmount(value)) {
        errors.push(`${field} must be a number`);
      }

      if (rules.minLength && String(value).length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }
    }

    return errors;
  }
}

export { DataValidator };