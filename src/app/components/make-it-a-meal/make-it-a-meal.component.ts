import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { DotButton, DotButtonType, DotMeal, getCatalogButton, getCombosCatalogButton } from 'dotsdk';
import { Animations } from '@dotxix/animation';
import { AbstractDynamicComponent, ContentService, DynamicContentParams, DynamicContentRef, DynamicContentService } from '@dotxix/services';
import { log } from '@dotxix/helpers';
import { ButtonDetailsComponent } from '../button-details/button-details.component';
import { ComboStepperComponent } from '../combo-stepper/combo-stepper.component';

@Component({
  selector: 'acr-make-it-a-meal',
  templateUrl: './make-it-a-meal.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
})
export class MakeItAMealComponent extends AbstractDynamicComponent implements OnInit {
  public exitAnimation = false;
  public buttons: DotMeal[];

  constructor(
    protected dataParams: DynamicContentParams,
    protected dynamicContentRef: DynamicContentRef,
    protected dynamicContentService: DynamicContentService,
    protected contentService: ContentService
  ) {
    super();
  }

  public ngOnInit(): void {
    // this.buttons = _.cloneDeep(this.dataParams.btn);
    this.buttons = this.dataParams.btn.filter(
      (button) => button.ButtonType === DotButtonType.MENU_BUTTON || button.ButtonType === DotButtonType.ITEM_BUTTON
    );
    log('makeItAMeal: ', this.buttons);
  }

  public closeModal(buttonText?: string) {
    this.exitAnimation = true;
    setTimeout(() => this.dynamicContentRef.close(buttonText), 500);
  }

  public selectedMeal(mealButton: DotMeal) {
    let button: DotButton;
    switch (mealButton.ButtonType) {
      case DotButtonType.MENU_BUTTON:
        button = getCombosCatalogButton(mealButton.Id);
        if (button && button.hasCombos) {
          this.closeModal();
          this.dynamicContentService.openContent(ComboStepperComponent, { btn: button });
        }
        break;
      case DotButtonType.ITEM_BUTTON:
      
        button = getCatalogButton(mealButton.Id);
        if (button) {
          this.closeModal();
          this.dynamicContentService.openContent(ButtonDetailsComponent, { btn: button });
        }
        break;
      default:
        this.closeModal();
    }
  }
}
