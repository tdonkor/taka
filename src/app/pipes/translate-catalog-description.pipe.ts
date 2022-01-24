import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, getCatalogButton } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
  name: 'translateCatalogDescription'
})
export class TranslateCatalogDescription implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {
  }

  public transform(button: DotButton): string | null {
    const catalogButton = getCatalogButton(button.Link);
    if (catalogButton) {
      return this.translationsService.getTranslatedButtonDescription(catalogButton);
    }

    return null;
  }
}
