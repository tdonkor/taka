import { Pipe, PipeTransform } from '@angular/core';
import { DotButton } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translateDlgMessageDictionary'
  })
export class DlgMessageDictionaryTranslationPipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {}

  public transform(button: DotButton): string {
      if (button && button.DlgMessageDictionary && Object.keys(button.DlgMessageDictionary).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
          const t = button.DlgMessageDictionary[this.translationsService.currentLanguage.code.toUpperCase()];
          return t ? t : button.DlgMessageDictionary['DEF'];
        } else if (button && button.DlgMessage) {
          return button.DlgMessage;
        } else {
          return null;
        }
  }
}
