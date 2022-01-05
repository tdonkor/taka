import { Pipe, PipeTransform } from '@angular/core';
import { DotCombo } from 'dotsdk';
import { ApplicationSettingsService } from '../services/app-settings.service';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
    name: 'translateComboImage'
  })
export class ComboImageTranslatePipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService,
              protected appSettings: ApplicationSettingsService) {
  }

  public transform(combo: DotCombo): string {
      if (this.getPath(combo)) {
        return `${this.appSettings.bridgeAssetsPath}/Items/${this.getPath(combo)}`;
      }
      return null;
  }

  public getPath(combo: DotCombo): string {
    if (combo && combo['ImageDictionary'] && Object.keys(combo['ImageDictionary']).length !== 0 && this.translationsService.currentLanguage && this.translationsService.currentLanguage.code) {
      const t = combo['ImageDictionary'][this.translationsService.currentLanguage.code.toUpperCase()];
      return t ? t : combo['ImageDictionary']['DEF'];
    } else if (combo && combo['Image']) {
      return combo['Image'];
    } else {
      return null;
    }
  }
}
