import { NutritionalInformationDisplayType } from '../../models/enums/general.enum';
import { PromoInputOption } from '../../models/enums/general.enum';

import { Component, OnInit } from '@angular/core';
import { ApplicationSettingsService } from '../../services/app-settings.service';
import { DynamicContentService } from '../../services/dynamic-content/dynamic-content.service';
import { StatusService } from '../../services/status.service';
import { PromosComponent } from '../../pages/promotions/promos.component';
import { CaloriesComponent } from '../calories/calories.component';
import { AllergenSelectionComponent } from '../allergen-selection/allergen-selection.component';
import { DotPageType, getHiddenPageList } from 'dotsdk';
import { ContentService } from '@dotxix/services/content.service';

@Component({
  selector: 'acr-voucher-info',
  templateUrl: './voucher-info.component.html',
})
export class VoucherInfoComponent implements OnInit {
  public displayPromoButton: boolean;

  public get displayCaloriesButton(): boolean {
    return (
      this.appSettings.nutritionalInformationDisplayType === NutritionalInformationDisplayType.ONLY_CALORIES ||
      this.appSettings.nutritionalInformationDisplayType === NutritionalInformationDisplayType.ALL
    );
  }

  public get displayAllergensButton(): boolean {
    return (
      this.appSettings.nutritionalInformationDisplayType === NutritionalInformationDisplayType.ONLY_ALLERGENS ||
      this.appSettings.nutritionalInformationDisplayType === NutritionalInformationDisplayType.ALL
    );
  }

  constructor(
    protected dynamicContentService: DynamicContentService,
    protected appSettings: ApplicationSettingsService,
    protected statusService: StatusService,
    protected contentService: ContentService
  ) {}

  public ngOnInit() {
    this.displayPromoButton = (getHiddenPageList(true)?.some(page => page.PageType === DotPageType.MAIN_PROMO) &&
    (this.appSettings.promoInputOption === PromoInputOption.BOTH ||
    this.appSettings.promoInputOption === PromoInputOption.KEYBOARD ||
    (this.appSettings.promoInputOption === PromoInputOption.SCANNER && this.statusService.isScannerAvailableForApp)));
  }
  public useVoucher() {
    this.dynamicContentService.openContent(PromosComponent, {});
  }

  public toCalories(): void {
    this.dynamicContentService.openContent(CaloriesComponent, {});
  }
  public allergensClick() {
    this.dynamicContentService.openContent(AllergenSelectionComponent, {});
  }
}
