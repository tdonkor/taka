import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, getCatalogButton } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
  name: 'translateCatalogModifierLabel'
})
export class TranslateCatalogModifierLabel implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {
  }

  public transform(button: DotButton): string | null {
    const catalogButton = getCatalogButton(button.Link);

    if (catalogButton && catalogButton['ModifierLabelDictionary'] && Object.keys(catalogButton['ModifierLabelDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
      const t = catalogButton['ModifierLabelDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
      return t ? t : catalogButton['ModifierLabelDictionary']['DEF'];
    } else {
        return null;
      }
  }
}
