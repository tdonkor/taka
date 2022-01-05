import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotButtonType, DotMeal, getCatalogButton, getCombosCatalogButton } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
  name: 'makeItAMealTitle'
})
export class MakeItAMealTitlePipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {
  }

  public transform(mealButton: DotMeal): string {
    let button: DotButton;
    switch (mealButton.ButtonType) {
      case DotButtonType.MENU_BUTTON:
        button = getCombosCatalogButton(mealButton.Id);
        break;
      case DotButtonType.ITEM_BUTTON:
        button = getCatalogButton(mealButton.Id);
    }
    if (button && button['CatalogNameDictionary'] && Object.keys(button['CatalogNameDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
        const t = button['CatalogNameDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
        return t ? t : button['CatalogNameDictionary']['DEF'];
      } else if (button && button.Caption) {
        return button.Caption;
      } else {
        return null;
      }
  }
}

