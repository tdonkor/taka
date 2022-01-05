import { Pipe, PipeTransform } from '@angular/core';
import { DotCombo } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translateComboStepTitle'
  })
export class ComboStepTitleTranslationPipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {}

  public transform(combo: DotCombo): string {
      if (combo && combo['TitleDictionary'] && Object.keys(combo['TitleDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
          const t = combo['TitleDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
          return t ? t : combo['TitleDictionary']['DEF'];
        } else if (combo && combo.Title) {
          return combo.Title;
        } else {
          return null;
        }
  }
}
