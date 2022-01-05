import { Pipe, PipeTransform } from '@angular/core';
import { DotButton } from 'dotsdk';
import { ApplicationSettingsService } from '../services/app-settings.service';
import { TranslationsService } from '../services/translations/translations.service';


@Pipe({
  name: 'translatePicture'
})
export class TranslatePicturePipe implements PipeTransform {

  constructor(protected translationsService: TranslationsService,
              protected appSettingsService: ApplicationSettingsService) {
  }

  public transform(button: DotButton): string {
    const path = this.translationsService.getTranslatedButtonPicture(button);
    if (path) {
      return `${this.appSettingsService.bridgeAssetsPath}/Items/${path}`;
    }
    return './assets/branding/taka.PNG';
  }
}
