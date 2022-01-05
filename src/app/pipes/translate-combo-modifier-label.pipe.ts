import { Pipe, PipeTransform } from '@angular/core';
import { DotButton } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translateComboModifierLabel'
  })
export class ComboModifierLabelTranslationPipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {}

  public transform(button: DotButton): string | null {
    if (button && button['ModifierLabelDictionary'] && Object.keys(button['ModifierLabelDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
      const t = button['ModifierLabelDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
      return t ? t : button['ModifierLabelDictionary']['DEF'];
    } else {
      return null;
    }
  }
}
