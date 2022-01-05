import { Pipe, PipeTransform } from '@angular/core';
import { DotCombo } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translateComboStepName'
  })
export class ComboStepNameTranslationPipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {}

  public transform(combo: DotCombo): string {
      if (combo && combo['ComboStepNameDictionary'] && Object.keys(combo['ComboStepNameDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
          const t = combo['ComboStepNameDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
          return t ? t : combo['ComboStepNameDictionary']['DEF'];
        } else if (combo && combo.ComboStepName) {
          return combo.ComboStepName;
        } else {
          return null;
        }
  }
}
