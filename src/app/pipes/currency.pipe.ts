import { Pipe, PipeTransform } from '@angular/core';
import { LocalizationService } from '../services/localization.service';

@Pipe({
  name: 'dotCurrency'
})
export class CurrencyPipe implements PipeTransform {
  constructor(protected localizationService: LocalizationService) {}

  /**
   *
   * @param value  The price that you want to format as number.
   * @param formatZeroValue Choose if the pipe should format a price value of 0 (true) or if it should return an empty string(false). Defaults to false.
   */
  public transform(value: number, formatZeroValue: boolean = false): string {

    if (value === 0 && formatZeroValue) {
      return this.localizationService.formatCurrency(value);
    }
    if (value === 0) {
      return '';
    }
    return this.localizationService.formatCurrency(value);
  }
}
