import { Injectable } from '@angular/core';
import { ApplicationSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  constructor(protected appSettings: ApplicationSettingsService) {}

  public formatNumber(value: number, decimals?: number): string {
    const signal = Math.sign(value) < 0 ? '-' : '';
    const absoluteValue = Math.abs(value);

    if (!decimals || decimals < 0) {
      decimals = 0;
    }

    const integerPart = decimals > 0 ? Math.floor(absoluteValue) : Math.round(absoluteValue);
    // const formattedIntegerPart = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.data.thousandSeparator);
    const formattedIntegerPart = integerPart.toString();

    if (decimals === 0) {
      return signal + formattedIntegerPart;
    } else {
      const decimalPart = Math.round((absoluteValue - integerPart) * Math.pow(10, decimals));
      const formattedDecimalPart = decimalPart.pad(decimals);
      return signal + formattedIntegerPart + this.appSettings.decimalSeparator + formattedDecimalPart;
    }
  }

  public formatDate(value: Date, pattern?: string): string {
    if (!pattern) {
      pattern = 'yyyy-MM-dd HH:mm:ss';
    }

    if (!(value instanceof Date)) {
      return '';
    }

    return value.format(pattern);
  }

  /**
   * @deprecated Use the 'formatNumber' method instead
   */
  public formatDecimals(value, decimals): string {
    return this.formatNumber(value, decimals);
  }

  /**
   * @deprecated Use the 'formatCurrency' method instead
   */
  public returnFormatPrice(formattedNumber: string): string {
    const pattern = this.appSettings.currencySymbolBefore ? '{0} {1}' : '{1} {0}';
    return String.compositeFormat(pattern, this.appSettings.currencySymbol, formattedNumber);
  }

  public formatCurrency(value: number): string {
    let decimals = 2;

    if (this.appSettings.currencySymbol === '元') {
      decimals = 1;
    }

    if (this.appSettings.currencySymbol === 'KR') {
      decimals = 0;
    }

    const formattedNumber = this.formatNumber(value / 100, decimals);

    const pattern = this.appSettings.currencySymbolBefore ? '{0}{1}' : '{1}{0}';
    return String.compositeFormat(pattern, this.appSettings.currencySymbol, formattedNumber);
  }
}
