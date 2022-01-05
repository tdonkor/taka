import { Pipe, PipeTransform } from '@angular/core';
import { DotI18n } from 'dotsdk';

import { TranslationsService } from '../services/translations/translations.service';
import { TextProcessorService } from '../services/translations/text-processor.service';


@Pipe({
    name: 'dotTitleTranslate',
    pure: false
})
export class DotCdkTitleTranslatePipe implements PipeTransform {

    constructor(private translationsService: TranslationsService,
                private textProcessorService: TextProcessorService) {
    }

    public transform(value: DotI18n | string, ...args: any): string {
        return this.textProcessorService.processText(this.translationsService.translateTitle(value), ...args);
    }
}
