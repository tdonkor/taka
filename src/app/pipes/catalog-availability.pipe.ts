import { DotAvailabilityService, DotButton, DotCatalogLoader, FilesLoaderService } from 'dotsdk';
import { Pipe, PipeTransform } from '@angular/core';

import { CombosCatalog } from '../models';
import { TranslatePicturePipe } from './translate-picture.pipe';

@Pipe({
  name: 'catalogButtonAvailability',
})
export class CatalogAvailabilityPipe implements PipeTransform {
  constructor(protected translatePicturePipe: TranslatePicturePipe) {}

  // same checks as buttonAvailability pipe (filterTags in pages.json) ++ a second check in catalog.json ++ exclude any buttonType except type 2 (item) from catalog search
  public transform(buttons: DotButton[]): DotButton[] {
    if (buttons.length) {
      const availableButtons = this.filterByButtonsAvailable(buttons);
      const avlbComboCatalogButtons = (FilesLoaderService.getInstance().loadersMap.get(CombosCatalog) as CombosCatalog).Buttons;
      const avlbCatalogButtons = this.filterByButtonsAvailable(DotCatalogLoader.getInstance().loadedModel.Buttons);
      const catalogsButtons = [...avlbCatalogButtons, ...avlbComboCatalogButtons];
      const catalogAvailabilityButtons = availableButtons.filter((btn) =>
        catalogsButtons.some((btn2) => btn.Link === btn2.Link || btn.ButtonType !== 2)
      );

      if (catalogAvailabilityButtons.length) {
        return catalogAvailabilityButtons;
      }
      return availableButtons;
    }
  }

  private filterByButtonsAvailable(arr: DotButton[]): DotButton[] {
    return arr.filter((btn) => DotAvailabilityService.getInstance().isButtonAvailable(btn));
  }
}
