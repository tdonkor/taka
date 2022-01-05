import { Pipe, PipeTransform } from '@angular/core';

import { TranslationsService } from '../services/translations/translations.service';
import { TextProcessorService } from '../services/translations/text-processor.service';


@Pipe({
    name: 'dotTranslate',
    pure: false
})
export class DotCdkTranslatePipe implements PipeTransform {

    constructor(private translationsService: TranslationsService,
                private textProcessorService: TextProcessorService) {
    }

    public transform(value: string): string {
        return this.textProcessorService.processText(this.translationsService.translate(value));
    }
}
