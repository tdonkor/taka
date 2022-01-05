import { Component, OnDestroy, OnInit } from '@angular/core';
import { Animations } from '@dotxix/animation';
import { isAdaEnabled, isAutoPopFeatVisible } from '@dotxix/helpers';
import { DotCdkTranslatePipe } from '@dotxix/pipes';
import {
  AbstractDynamicComponent,
  BasketService,
  DynamicContentParams,
  DynamicContentRef,
  DynamicContentService,
  PromosService,
} from '@dotxix/services';

import { DotButton, DotPage, generateUUID } from 'dotsdk';

import { Subscription } from 'rxjs';
import { ButtonDetailsComponent } from '../button-details/button-details.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ComboStepperComponent } from '../combo-stepper/combo-stepper.component';

@Component({
  selector: 'acr-promo-stepper',
  templateUrl: './promo-stepper.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
})
export class PromoStepperComponent extends AbstractDynamicComponent implements OnInit, OnDestroy {
  public isAdaEnabled = isAdaEnabled;
  public currentPage: DotPage;
  public selectedPromoButtons: { step: number; button: DotButton }[] = [];
  public steps: DotPage[];
  public subscriptions: Subscription[] = [];
  public exitAnimation = false;
  public currentStepIndex = 0;

  public get promoButtons(): DotButton[] {
    return this.currentPage.Buttons;
  }
  // public get currentStepIndex(): number {
  //   return this.steps.findIndex(step => this.currentPage.ID === step.ID);
  // }
  public get currentPageMaxQty(): number {
    if (!this.currentPage.MaxQty || this.currentPage.MaxQty === 0) {
      return 1;
    } else {
      return this.currentPage.MaxQty;
    }
  }
  public get disableNextStep(): boolean {
    return !this.promoButtons.some((btn) => btn.Selected);
  }
  public get selectedButtons(): DotButton[] {
    return this.selectedPromoButtons.reduce((acc, n) => [...acc, n.button], []);
  }
  public get previousStepPromoButtons(): DotButton[] {
    return this.selectedPromoButtons.reduce((acc, n) => (n.step < this.currentStepIndex ? [...acc, n.button] : acc), []);
  }
  constructor(
    protected dynamicContentRef: DynamicContentRef,
    protected dynamicContentService: DynamicContentService,
    protected promosService: PromosService,
    protected basketService: BasketService,
    protected translatePipe: DotCdkTranslatePipe,
    protected dataParams: DynamicContentParams
  ) {
    super();
  }

  public ngOnInit() {
    this.currentPage = this.promosService.promoNode.getData();
    this.steps = this.getAllPromoPages();
    console.log('steps: ', this.steps);
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public selectPromoButton(button: DotButton) {
    button.isPromo = true;
    if (button.Selected) {
      this.select(button);
    } else if (button.hasModifiers && button.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, true, true))) {
      const modifierRef = this.dynamicContentService.openContent(ButtonDetailsComponent, { btn: button, disableAddButtonToBasket: true });
      this.subscriptions.push(
        modifierRef.afterClosed.subscribe((btn) => {
          this.select(btn);
        })
      );
    } else if (button.hasCombos) {
      const comboStepperRef = this.dynamicContentService.openContent(ComboStepperComponent, {
        btn: button,
        disableAddButtonToBasket: true,
      });
      this.subscriptions.push(
        comboStepperRef.afterClosed.subscribe((btn) => {
          if (btn.Selected) {
            btn.Selected = false;
            this.select(btn);
          }
        })
      );
    } else {
      this.select(button);
    }
  }
  public nextStep() {
    if (this.promosService.promoNode.next) {
      this.promosService.promoNode = this.promosService.promoNode.next;
      this.currentPage = this.promosService.promoNode.getData(this.selectedButtons);
      this.currentStepIndex++;
    } else {
      const promotionUUID = generateUUID();
      const promotionName = this.promosService.promotionQuery.message;
      this.selectedButtons.forEach((btn) => {
        btn['Promo'] = { name: promotionName, barcode: this.dataParams.promotionCode, UUID: promotionUUID };
        this.basketService.addButtonToBasket(btn);
      });
      this.promosService.scannedBarcodes.push({ name: promotionName, barcode: this.dataParams.promotionCode, UUID: promotionUUID });
      this.exitAnimation = true;
      setTimeout(() => this.dynamicContentRef.close(), 350);
    }
  }
  public previousStep() {
    if (this.promosService.promoNode.back) {
      this.promosService.promoNode = this.promosService.promoNode.back;
      this.currentPage = this.promosService.promoNode.getData(this.previousStepPromoButtons);
      this.currentStepIndex--;
    }
  }
  public cancelClick(): void {
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: this.translatePipe.transform('2021050701'),
      leftButtonText: this.translatePipe.transform('32'),
      rightButtonText: this.translatePipe.transform('33'),
    });

    this.subscriptions.push(
      contentRef.afterClosed.subscribe((response) => {
        if (response === 'Yes') {
          this.exitAnimation = true;
          setTimeout(() => this.dynamicContentRef.close(), 350);
        }
      })
    );
  }
  public getAllPromoPages(promoNode = this.promosService.promoNode, nodes = [this.promosService.promoNode.getData()]): DotPage[] {
    return promoNode.next ? this.getAllPromoPages(promoNode.next, [...nodes, promoNode.next.getData()]) : nodes;
  }
  public isButtonDisabled(button: DotButton): boolean {
    if (this.currentPageMaxQty === 1) {
      return false;
    }
    return !button.Selected && this.promoButtons.filter((btn) => btn.Selected).length >= this.currentPageMaxQty;
  }
  private select(button: DotButton) {
    if (button.Selected) {
      this.removeSelectedButton(button);
    } else {
      this.addSelectedButton(button);
    }
  }
  private removeSelectedButton(button: DotButton) {
    button.Selected = false;
    button.quantity = 0;
    const index = this.selectedPromoButtons.findIndex((x) => x.button.Link === button.Link);
    if (index >= 0) {
      this.selectedPromoButtons.splice(index, 1);
    }
    this.promoButtons.forEach((btn) => {
      if (btn.Link === button.Link) {
        btn.Selected = false;
        btn.quantity = 0;
      }
    });
  }
  private addSelectedButton(button: DotButton) {
    this.promoButtons.forEach((btn, index) => {
      if (btn.Selected && this.currentPageMaxQty === 1) {
        btn.Selected = false;
        btn.quantity = 0;
        const selectedIndex = this.selectedPromoButtons.findIndex((b) => b.button.Link === btn.Link);
        if (selectedIndex >= 0) {
          this.selectedPromoButtons.splice(selectedIndex, 1);
        }
      }
      if (btn.Link === button.Link) {
        btn.Selected = true;
        btn.quantity = 1;
      }
    });
    button.Selected = true;
    button.quantity = 1;
    this.selectedPromoButtons.push({ step: this.currentStepIndex, button});
  }
}
