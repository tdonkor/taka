import { NgModule } from '@angular/core';
import { TranslatePicturePipe } from '../pipes/translate-picture.pipe';
import { ComboImageTranslatePipe } from './translate-combo-image.pipe';
import { ComboStepTitleTranslationPipe } from './translate-combo-title.pipe';
import { ComboModifierLabelTranslationPipe } from './translate-combo-modifier-label.pipe';
import { ComboStepNameTranslationPipe } from './translate-combostepname.pipe';
import { CatalogPicturePipe } from './catalog-picture.pipe';
import { TranslateCatalogTitle } from './translate-catalog-title.pipe';
import { TranslateCatalogModifierLabel } from './translate-catalog-modifier-label.pipe';
import { AllergenLabelTranslationPipe } from './translate-allergen-label.pipe';
import { CurrencyPipe } from './currency.pipe';
import { PrefixesNameTranslationPipe } from './translate-prefixes-name.pipe';
import { DlgMessageDictionaryTranslationPipe } from './translate-dlg-message.pipe';
import { MakeItAMealImagePipe } from './translate-make-it-a-meal-image.pipe';
import { CatalogAvailabilityPipe } from './catalog-availability.pipe';
import { DotCdkTranslateCaptionPipe } from './dot-translate-caption.pipe';
import { DotCdkTranslatePipe } from './dot-translate.pipe';
import { DotCdkTitleTranslatePipe } from './dot-title-translate.pipe';
import { MakeItAMealTitlePipe } from './translate-make-it-a-meal-title.pipe';
import { MakeItAMealPricePipe } from './translate-make-it-a-meal-price.pipe';

@NgModule({
    declarations: [
        TranslatePicturePipe,
        ComboStepNameTranslationPipe,
        ComboImageTranslatePipe,
        ComboStepTitleTranslationPipe,
        ComboModifierLabelTranslationPipe,
        TranslateCatalogTitle,
        CatalogPicturePipe,
        TranslateCatalogModifierLabel,
        AllergenLabelTranslationPipe,
        CurrencyPipe,
        PrefixesNameTranslationPipe,
        DlgMessageDictionaryTranslationPipe,
        MakeItAMealImagePipe,
        CatalogAvailabilityPipe,
        DotCdkTranslateCaptionPipe,
        DotCdkTranslatePipe,
        CurrencyPipe,
        DotCdkTitleTranslatePipe,
        MakeItAMealTitlePipe,
        MakeItAMealPricePipe
    ],
    exports: [
        TranslatePicturePipe,
        ComboStepNameTranslationPipe,
        ComboImageTranslatePipe,
        ComboStepTitleTranslationPipe,
        ComboModifierLabelTranslationPipe,
        TranslateCatalogTitle,
        CatalogPicturePipe,
        TranslateCatalogModifierLabel,
        AllergenLabelTranslationPipe,
        CurrencyPipe,
        PrefixesNameTranslationPipe,
        DlgMessageDictionaryTranslationPipe,
        MakeItAMealImagePipe,
        CatalogAvailabilityPipe,
        DotCdkTranslateCaptionPipe,
        DotCdkTranslatePipe,
        DotCdkTitleTranslatePipe,
        MakeItAMealTitlePipe,
        MakeItAMealPricePipe
    ],
    providers: [
        TranslatePicturePipe,
        CatalogPicturePipe,
        TranslateCatalogTitle,
        ComboModifierLabelTranslationPipe,
        TranslateCatalogModifierLabel,
        CurrencyPipe
    ]
})
export class PipesModule {}
