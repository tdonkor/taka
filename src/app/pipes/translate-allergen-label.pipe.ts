import { Pipe, PipeTransform } from '@angular/core';
import { DotAllergen } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translateAllergenLabel'
  })
export class AllergenLabelTranslationPipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {}

  public transform(allergen: DotAllergen): string {
      if (allergen && allergen.LabelDictionary && Object.keys(allergen.LabelDictionary).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
          const t = allergen.LabelDictionary[this.translationsService.currentLanguage.code.toUpperCase()];
          return t ? t : allergen.LabelDictionary['DEF'];
        } else if (allergen && allergen.Label) {
          return allergen.Label;
        } else {
          return null;
        }
  }
}
