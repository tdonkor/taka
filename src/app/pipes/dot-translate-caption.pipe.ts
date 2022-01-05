import { Pipe, PipeTransform } from '@angular/core';
import { TranslationsService } from '../services/translations/translations.service';
import { DotButton } from 'dotsdk';


@Pipe({
    name: 'dotTranslateCaption',
    pure: false
})
export class DotCdkTranslateCaptionPipe implements PipeTransform {

    constructor(private translationsService: TranslationsService) {
    }

    public transform(value: DotButton): string {
        return this.translationsService.getTranslatedButtonCaption(value);
    }
}
