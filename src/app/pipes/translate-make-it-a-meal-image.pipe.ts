import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotButtonType, DotMeal, getCatalogButton, getCombosCatalogButton } from 'dotsdk';
import { TranslatePicturePipe } from './translate-picture.pipe';

@Pipe({
  name: 'makeItAMealPicture'
})
export class MakeItAMealImagePipe implements PipeTransform {

  constructor(protected translatePicturePipe: TranslatePicturePipe) {
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
    if (button) {
      return this.translatePicturePipe.transform(button);
    }
    return './assets/branding/taka.PNG';
  }
}

