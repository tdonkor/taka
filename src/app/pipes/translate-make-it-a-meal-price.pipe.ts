import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotButtonType, DotMeal, getCatalogButton, getCombosCatalogButton } from 'dotsdk';
import { CurrencyPipe } from './currency.pipe';

@Pipe({
  name: 'makeItAMealPrice'
})
export class MakeItAMealPricePipe implements PipeTransform {

  constructor(protected dotCurrencyPipe: CurrencyPipe) {
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
    return button && button['MinPrice'] ? this.dotCurrencyPipe.transform(button['MinPrice']) : null;
  }
}

