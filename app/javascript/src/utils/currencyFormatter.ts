/**
 * Enhanced currency formatting utilities
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimal_places: number;
  separator: string;
  delimiter: string;
  format: string;
}

// Currency configurations
export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimal_places: 2,
    separator: '.',
    delimiter: ',',
    format: '%s%v', // %s = symbol, %v = value
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimal_places: 2,
    separator: ',',
    delimiter: '.',
    format: '%s %v',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimal_places: 2,
    separator: '.',
    delimiter: ',',
    format: '%s%v',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimal_places: 0,
    separator: '',
    delimiter: ',',
    format: '%s%v',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimal_places: 2,
    separator: '.',
    delimiter: ',',
    format: '%s %v',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimal_places: 2,
    separator: '.',
    delimiter: ',',
    format: '%s%v',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimal_places: 2,
    separator: '.',
    delimiter: ',',
    format: '%s%v',
  },
};

export class CurrencyFormatter {
  private config: CurrencyConfig;

  constructor(currencyCode: string = 'USD') {
    this.config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.USD;
  }

  /**
   * Format a number as currency
   */
  format(amount: number | string, options: Partial<CurrencyConfig> = {}): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(value)) {
      return this.config.format
        .replace('%s', this.config.symbol)
        .replace('%v', '0');
    }

    const mergedConfig = { ...this.config, ...options };
    
    // Format the number with proper decimal places
    const formatted = this.formatNumber(
      value,
      mergedConfig.decimal_places,
      mergedConfig.separator,
      mergedConfig.delimiter
    );

    // Apply currency format
    return mergedConfig.format
      .replace('%s', mergedConfig.symbol)
      .replace('%v', formatted);
  }

  /**
   * Format just the number part (without currency symbol)
   */
  formatNumber(
    value: number,
    decimals: number,
    separator: string,
    delimiter: string
  ): string {
    const fixed = value.toFixed(decimals);
    const [integerPart, decimalPart] = fixed.split('.');
    
    // Add thousand separators
    const withDelimiters = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter);
    
    // Combine with decimal part if needed
    if (decimals > 0 && decimalPart) {
      return `${withDelimiters}${separator}${decimalPart}`;
    }
    
    return withDelimiters;
  }

  /**
   * Parse a formatted currency string back to number
   */
  parse(formattedValue: string): number {
    // Remove currency symbol and whitespace
    let cleaned = formattedValue.replace(this.config.symbol, '').trim();
    
    // Remove thousand delimiters
    cleaned = cleaned.replace(new RegExp(`\\${this.config.delimiter}`, 'g'), '');
    
    // Replace decimal separator with period if needed
    if (this.config.separator !== '.') {
      cleaned = cleaned.replace(this.config.separator, '.');
    }
    
    return parseFloat(cleaned) || 0;
  }

  /**
   * Get currency symbol
   */
  getSymbol(): string {
    return this.config.symbol;
  }

  /**
   * Get currency code
   */
  getCode(): string {
    return this.config.code;
  }

  /**
   * Format as accounting (negative in parentheses)
   */
  formatAccounting(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (value < 0) {
      const formatted = this.format(Math.abs(value));
      return `(${formatted})`;
    }
    
    return this.format(value);
  }

  /**
   * Format with explicit positive/negative sign
   */
  formatSigned(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = this.format(Math.abs(value));
    
    if (value > 0) {
      return `+${formatted}`;
    } else if (value < 0) {
      return `-${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Format as compact notation (1K, 1M, etc.)
   */
  formatCompact(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    const absValue = Math.abs(value);
    
    let suffix = '';
    let divisor = 1;
    
    if (absValue >= 1e9) {
      suffix = 'B';
      divisor = 1e9;
    } else if (absValue >= 1e6) {
      suffix = 'M';
      divisor = 1e6;
    } else if (absValue >= 1e3) {
      suffix = 'K';
      divisor = 1e3;
    }
    
    if (divisor > 1) {
      const compactValue = (value / divisor).toFixed(1);
      return `${this.config.symbol}${compactValue}${suffix}`;
    }
    
    return this.format(value);
  }
}

// Convenience functions
export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'USD',
  options: Partial<CurrencyConfig> = {}
): string {
  const formatter = new CurrencyFormatter(currencyCode);
  return formatter.format(amount, options);
}

export function parseCurrency(
  formattedValue: string,
  currencyCode: string = 'USD'
): number {
  const formatter = new CurrencyFormatter(currencyCode);
  return formatter.parse(formattedValue);
}

export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  return CURRENCY_CONFIGS[currencyCode]?.symbol || '$';
}

export function formatCompactCurrency(
  amount: number | string,
  currencyCode: string = 'USD'
): string {
  const formatter = new CurrencyFormatter(currencyCode);
  return formatter.formatCompact(amount);
}

// Export default instance for USD
export default new CurrencyFormatter('USD');