import { Component, OnDestroy, OnInit } from '@angular/core';
import { DotButton, DotButtonType, DotPage, OrderDiscountResponse, PromoNode, PromotionQuery, generateUUID } from 'dotsdk';

import { AbstractDynamicComponent } from '../../services';
import { Animations } from '../../animation/animation';
import { ApplicationSettingsService } from '../../services';
import { BasketService } from '../../services';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { DotCdkTranslatePipe } from '../../pipes/dot-translate.pipe';
import { DynamicContentParams } from '../../services';
import { DynamicContentRef } from '../../services';
import { DynamicContentService } from '../../services';
import { InfoDialogComponent } from '../../components/info-dialog/info-dialog.component';
import { PROMOS_STATE } from '../../models/enums/promos.enum';
import { ProductStatus } from '../../models/enums/general.enum';
import { PromoInputOption } from '../../models/enums/general.enum';
import { PromoResponseType } from '../../models/enums/promos.enum';
import { PromoStepperComponent } from '../../components/promo-stepper/promo-stepper.component';
import { PromosService } from '../../services';
import { StatusService } from '../../services';
import { Subscription } from 'rxjs';
import { createFakeButton } from '../../helpers/fake-button.helper';

@Component({
  selector: 'acr-promos',
  templateUrl: './promos.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
})
export class PromosComponent extends AbstractDynamicComponent implements OnInit, OnDestroy {
  public get promoPage(): DotPage {
    return this._promoPage;
  }
  public errorMessage: string;
  public componentState: PROMOS_STATE = PROMOS_STATE.START;
  public promosState = PROMOS_STATE;
  public _promoPage: DotPage = null;
  public barcode = '';
  public animationState: 'visible' | 'invisible';
  public exitAnimation = false;
  public subscriptions: Subscription[] = [];

  constructor(
    protected dataParams: DynamicContentParams,
    protected dynamicContentRef: DynamicContentRef,
    protected statusService: StatusService,
    protected translatePipe: DotCdkTranslatePipe,
    protected basketService: BasketService,
    protected dynamicContentService: DynamicContentService,
    protected appSettingsService: ApplicationSettingsService,
    protected promosService: PromosService
  ) {
    super();
  }

  public async ngOnInit() {
    switch (this.appSettingsService.promoInputOption) {
      case PromoInputOption.BOTH:
        this.statusService.isScannerAvailableForApp ? (this.componentState = PROMOS_STATE.START) : (this.componentState = PROMOS_STATE.KEYBOARD);
        break;
      case PromoInputOption.KEYBOARD:
        this.componentState = PROMOS_STATE.KEYBOARD;
        break;
      case PromoInputOption.SCANNER:
        this.statusService.isScannerAvailableForApp ? (this.componentState = PROMOS_STATE.SCAN) : (this.componentState = PROMOS_STATE.KEYBOARD);
    }
    this.animationState = 'visible';
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public showScan() {
    this.componentState = PROMOS_STATE.SCAN;
  }

  public showKeyboard() {
    this.componentState = PROMOS_STATE.KEYBOARD;
  }

  public showContinueButton() {
    return this.componentState === PROMOS_STATE.KEYBOARD || this.componentState === PROMOS_STATE.VALID_PROMOS;
  }

  public cancelClick(): void {
    this.exitAnimation = true;
    setTimeout(() => this.dynamicContentRef.close(), 350);
  }

  public onContinueButtonClicked() {
    this.componentState === PROMOS_STATE.KEYBOARD ? this.usePromoCode(this.barcode) : this.addToBasket();
  }

  public barcodeChangedHandler(text: string) {
    this.barcode = text;
  }

  public scanCodeHandler(text: string) {
    this.barcode = text;
    this.usePromoCode(this.barcode);
  }

  public selectButton(button: DotButton) {
    if (button.Selected) {
      button.Selected = false;
      button.quantity = 0;
    } else {
      this._promoPage.Buttons.forEach((btn) => {
        if (btn.Link === button.Link) {
          btn.Selected = true;
          btn.quantity = 1;
        } else {
          btn.Selected = false;
          btn.quantity = 0;
        }
      });
    }
  }
  protected setModifiersIncludedQuantity(button: DotButton) {
    button.ModifiersPage.Modifiers.forEach((modifier) => {
      if (Number.isInteger(modifier.PageInfo.MaxQuantity) && modifier.PageInfo.MaxQuantity > 0) {
        const sumIncludedQuantities = modifier.Buttons.reduce((acc, btn) => {
          acc += btn.IncludedQuantity ? btn.IncludedQuantity : 0;
          return acc;
        }, 0);
        if (sumIncludedQuantities <= modifier.PageInfo.MaxQuantity) {
          modifier.Buttons.forEach((btn) => {
            btn.quantity = btn.MinQuantity ? btn.MinQuantity : btn.quantity;
            if (
              Number.isInteger(btn.IncludedQuantity) &&
              btn.IncludedQuantity > 0 &&
              Number.isInteger(btn.MaxQuantity) &&
              btn.MaxQuantity > 0
            ) {
              if (Number.isInteger(btn.MinQuantity) && btn.IncludedQuantity < btn.MinQuantity) {
                btn.IncludedQuantity = btn.MinQuantity;
              }
              if (btn.IncludedQuantity > btn.MaxQuantity) {
                btn.IncludedQuantity = btn.MaxQuantity;
              }
              if (
                Number(btn.ButtonStatus) === ProductStatus.UNAVAILABLE &&
                Number.isInteger(btn.IncludedQuantity) &&
                btn.IncludedQuantity > 0
              ) {
                btn.IncludedQuantity = 0;
                btn.Selected = false;
              }
              btn.quantity = btn.IncludedQuantity;
              btn.Selected = btn.quantity > 0;
            }
          });
        } else {
          modifier.Buttons.forEach((btn) => {
            if (btn.MinQuantity > 0 && btn.quantity < btn.MinQuantity) {
              btn.quantity = btn.MinQuantity;
            }
            btn.Selected = btn.quantity > 0;
          });
        }
      }
    });
  }

  protected usePromoCode(promoCode: string) {
    switch (this.promosService.findPromoByBarcode(promoCode)) {
      case PromoResponseType.ORDER_DISCOUNT:
        if (!this.promoNumberAllowed(promoCode, this.promosService.promotionQuery)) {
          this.promosService.orderDiscountPromoInfo.clearAppliedOrderDiscountFromElog();
          return;
        }
        const oldOrderDiscountButtonIndex = this.basketService.buttons.findIndex((button) => button['$$OrderDiscount'] >= 0);
        if (oldOrderDiscountButtonIndex >= 0) {
          this.basketService.buttons.splice(oldOrderDiscountButtonIndex, 1);
        }
        const btn = createFakeButton();
        const promotionUUID = generateUUID();
        const promotionName = this.promosService.promotionQuery.message;
        btn['Promo'] = { name: promotionName, barcode: this.dataParams.promotionCode, UUID: promotionUUID };
        btn.Price =
          (this.promosService.orderDiscountPromoInfo.percent / 100).toString() + '% ' + this.translatePipe.transform('20210504001');
        btn.Caption = this.promosService.orderDiscountPromoInfo.name;
        btn['$$OrderDiscount'] = this.promosService.orderDiscountPromoInfo.discountedAmount;
        btn.Visibility = this.setPOSNotVisible(btn.Visibility);
        btn.isPromo = true;
        btn.quantity = 1;
        btn.ButtonType = DotButtonType.ITEM_BUTTON;
        const contentRef = this.dynamicContentService.openContent(InfoDialogComponent, {
          title:
            oldOrderDiscountButtonIndex >= 0 ? this.translatePipe.transform('20210504005') : this.translatePipe.transform('20210504002'),
          buttonText: this.translatePipe.transform('20210504003'),
        });
        this.subscriptions.push(
          contentRef.afterClosed.subscribe((response) => {
            this.basketService.addButtonToBasket(btn);
            this.dynamicContentRef.close();
          })
        );
        this.promosService.scannedBarcodes.push(btn['Promo']);
        break;
      case PromoResponseType.PROMO_NODE:
        console.log('promo node: ', this.promosService.promoNode);
        if (!this.promoNumberAllowed(promoCode, this.promosService.promotionQuery)) {
          return;
        }
        this.dynamicContentService.openContent(PromoStepperComponent, { promotionCode: promoCode });
        this.dynamicContentRef.close();

        break;
      case PromoResponseType.PROMO_ERROR:
        this.componentState === PROMOS_STATE.KEYBOARD
          ? this.showKeyboardError(this.promosService.errorMessage)
          : this.showScannerError(this.promosService.errorMessage);
        break;
    }
  }

  protected showPromoButtons(promoButtons: DotButton[]) {
    this._promoPage = promoButtons[0].Page;
    if (this._promoPage.Buttons.length === 1 && this._promoPage.Buttons[0].hasCombos) {
      // this.dynamicContentService.openContent(ComboStepperComponent, {btn: this._promoPage.Buttons[0]});
      this.dynamicContentRef.close();
    } else if (this._promoPage.Buttons[0].Page) {
      this._promoPage.Buttons[0].Page.TitleDictionary = this._promoPage.Buttons[0].Page.TitleDictionary || this._promoPage.TitleDictionary;
      this._promoPage = this._promoPage.Buttons[0].Page;
    }
  }

  protected showKeyboardError(errorMessage: string) {
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: typeof errorMessage === 'string' && errorMessage !== '' ? errorMessage : this.translatePipe.transform('68'),
      leftButtonText: this.translatePipe.transform('23'),
      rightButtonText: this.translatePipe.transform('70'),
    });

    this.subscriptions.push(
      contentRef.afterClosed.subscribe((response) => {
        if (response === 'Yes') {
          this.barcode = '';
        }
      })
    );
  }

  protected showScannerError(errorMessage: string) {
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: typeof errorMessage === 'string' && errorMessage !== '' ? errorMessage : this.translatePipe.transform('2021012204'),
      leftButtonText: this.translatePipe.transform('32'),
      rightButtonText: this.translatePipe.transform('33'),
    });

    this.subscriptions.push(
      contentRef.afterClosed.subscribe((response) => {
        if (response === 'Yes') {
          this.componentState = PROMOS_STATE.SCAN;
        } else {
          this.componentState = this.appSettingsService.promoInputOption === PromoInputOption.BOTH ? PROMOS_STATE.START : PROMOS_STATE.SCAN;
        }
      })
    );
  }

  protected addToBasket() {
    const selectedButton = this._promoPage.Buttons.find((btn) => btn.Selected);
    this.setModifiersIncludedQuantity(selectedButton);
    if (selectedButton) {
      this.basketService.addButtonToBasket(selectedButton);
    }
    this.dynamicContentRef.close();
  }

  private setPOSNotVisible(visibility: string): string {
    if (!visibility) {
      return '32';
    }
    const visibilityNumber = Number(visibility);
    if (Number.isInteger(visibilityNumber)) {
      return (visibilityNumber | 32).toString();
    }
    return '32';
  }

  private promoNumberAllowed(promoCode: string, promotionQuery: PromotionQuery): boolean {
    const sameBarcodeNumber = this.promosService.scannedBarcodes.reduce((acc, promoDef) => {
      if (promoDef.barcode === promoCode) {
        acc++;
      }
      return acc;
    }, 0);

    if (
      (promotionQuery.maximumPromotionNumber < 1 && promotionQuery.promoPayload instanceof OrderDiscountResponse) ||
      (promotionQuery.maximumPromotionNumber <= sameBarcodeNumber && promotionQuery.promoPayload instanceof PromoNode)
    ) {
      this.showMaximumAllowedPromo(true);
      return false;
    }

    if (
      (promotionQuery.maximumAllowedPromotionsNumber <= this.promosService.scannedBarcodes.length &&
        promotionQuery.promoPayload instanceof OrderDiscountResponse &&
        !this.basketService.buttons.some((button) => button['$$OrderDiscount'] >= 0)) ||
      (promotionQuery.maximumAllowedPromotionsNumber <= this.promosService.scannedBarcodes.length &&
        promotionQuery.promoPayload instanceof PromoNode)
    ) {
      this.showMaximumAllowedPromo(false);
      return false;
    }
    return true;
  }
  private showMaximumAllowedPromo(sameType = false) {
    this.dynamicContentService.openContent(InfoDialogComponent, {
      title: sameType ? this.translatePipe.transform('69') : this.translatePipe.transform('20210517001'),
      buttonText: this.translatePipe.transform('20210504003'),
    });
  }
}
