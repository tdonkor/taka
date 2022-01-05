import { Pipe, PipeTransform } from '@angular/core';
import { DotPrefixes } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translatePrefixesName'
  })
export class PrefixesNameTranslationPipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {}

  public transform(prefix: DotPrefixes): string {
      if (prefix && prefix['NameDictionary'] && Object.keys(prefix['NameDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
          const t = prefix['NameDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
          return t ? t : prefix['NameDictionary']['DEF'];
        } else {
          return null;
        }
  }
}
