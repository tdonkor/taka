import * as _ from 'lodash';

import { CalculateTotalMode, PAYMENT_TYPE } from '../models';
import { DotButton, PosElogHandler, PosRefintService } from 'dotsdk';

import { ApplicationSettingsService } from './app-settings.service';
import { BasketService } from './basket.service';
import { DynamicContentService } from './dynamic-content/dynamic-content.service';
import { Injectable } from '@angular/core';
import { PosOperationsService } from './pos-operations.service';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { StatusService } from './status.service';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  public get paymentType() {
    return this._paymentType;
  }
  // tslint:disable-next-line:adjacent-overload-signatures
  public set paymentType(value) {
    this._paymentType = value;
  }
  public get orderTotal() {
    return this._subtotalCents + this._taxCents;
  }
  public get tenderMediaId() {
    return this._tenderMediaId;
  }
  public set tenderMediaId(value) {
    this._tenderMediaId = value;
  }
  public get paymentRetries() {
    return this._paymentRetries;
  }
  public set paymentRetries(value) {
    this._paymentRetries = value;
  }
  public get orderPOSNumber() {
    return this._orderPOSNumber;
  }
  public set orderPOSNumber(value) {
    this._orderPOSNumber = value;
  }
  public get subtotalCents(): number {
    return this._subtotalCents;
  }
  public set subtotalCents(value: number) {
    this._subtotalCents = value;
  }
  public get taxCents(): number {
    return this._taxCents;
  }
  public set taxCents(value: number) {
    this._taxCents = value;
  }
  public get openedOrder(): Boolean {
    return this._openedOrder;
  }
  public set openedOrder(value: Boolean) {
    this._openedOrder = value;
  }
  public get receiptContent(): string {
    return this._receiptContent;
  }
  public set receiptContent(value: string) {
    this._receiptContent = value;
  }
  public get receiptPayAtCounter(): string {
    return this._receiptPayAtCounter;
  }
  public set receiptPayAtCounter(value: string) {
    this._receiptPayAtCounter = value;
  }
  public get basketButtons(): DotButton[] {
    return this._basketButtons;
  }
  public set basketButtons(value: DotButton[]) {
    this._basketButtons = value;
  }
  private _paymentType: PAYMENT_TYPE;
  private _subtotalCents = 0;
  private _taxCents = 0;
  private _tenderMediaId: string;
  private _orderPOSNumber: number;
  private _paymentRetries: number;
  private _openedOrder: Boolean;
  private _receiptContent: string;
  private _receiptPayAtCounter: string;
  private _basketButtons: DotButton[];

  constructor(
    public router: Router,
    public appSettingsService: ApplicationSettingsService,
    public sessionService: SessionService,
    public basketService: BasketService,
    public statusService: StatusService,
    protected dynamicContentService: DynamicContentService,
    protected posOperationService: PosOperationsService
  ) {
    this.sessionService.onRestartSession.subscribe((status) => {
      this._basketButtons = null;
      this.resetOrderTotal();
    });
    // this.router.events.subscribe((event: Event) => {
    // if (event instanceof NavigationEnd) {
    //   if (event.url === '/cod-view' || event.url === '/calculate-totals' && !this.previousUrls.includes(event.url)) {
    //     this.previousUrls.push(event.url);
    //   }
    // }});
  }

  public async startCheckoutTunnel() {
    this._subtotalCents = this.basketService.totalPrice;
    this._taxCents = 0;
    this._orderPOSNumber = null;
    this._tenderMediaId = '-1';
    this._paymentRetries = this.appSettingsService.maxPaymentRetries;
    this._openedOrder = false;
    this._receiptPayAtCounter = '';
    this._receiptContent = '';
    const paymentEnabled = this.statusService.paymentsAvailableForApp.find((payment) => payment.PaymentIsEnabled === true);

    if (paymentEnabled) {
      this.paymentType = paymentEnabled.PaymentType;
    }
    if (!this._basketButtons) {
      this.startEndSceneNavigation();
    } else {
      if (this.sameBasket()) {
        this.router.navigate(['cod-view']);
      } else {
        this._basketButtons = _.cloneDeep(this.basketService.buttons);
        if (this.appSettingsService.calculateTotalMode === CalculateTotalMode.VOID_ON_RETURN) {
          this.openedOrder = !(await this.posOperationService.sendVoidOrderToPOS());
          await PosRefintService.getInstance().processRefInt();
          PosElogHandler.getInstance().posConfig.posHeader.orderRefInt = PosRefintService.getInstance()._refInt;
        }
        this.startEndSceneNavigation();
      }
    }
  }

  public startEndSceneNavigation() {
    this.populateElogBeforeEndScene();
    this.appSettingsService.skipPrecalculate ? this.router.navigate(['cod-view']) : this.router.navigate(['calculate-totals']);
  }

  public resetOrderTotal() {
    this._subtotalCents = 0;
    this._taxCents = 0;
  }

  protected async populateElogBeforeEndScene() {
    PosElogHandler.getInstance().posConfig.posHeader.amounts = {
      ...PosElogHandler.getInstance().posConfig.posHeader.amounts,
      subtotalAmount: this.subtotalCents,
      taxAmount: this.taxCents,
      amountsTotalPaid:
        this.basketService.buttons.some((button) => button['$$OrderDiscount']) && this.subtotalCents + this.taxCents >= this.orderDiscount()
          ? this.subtotalCents + this.taxCents - this.orderDiscount()
          : this.subtotalCents + this.taxCents,
    };
    PosElogHandler.getInstance().posConfig.posHeader.orderStartTime = this.sessionService.orderStarted;
  }

  private sameBasket(): boolean {
    if (this.basketService.buttons.length !== this.basketButtons.length) {
      return false;
    }
    for (const oldButton of this.basketButtons) {
      const newButton = this.basketService.buttons.find(
        (newBtn) => newBtn.Link === oldButton.Link && newBtn.uuid === oldButton.uuid && newBtn.quantity === oldButton.quantity
      );
      if (!newButton) {
        return false;
      } else {
        const similarButtons = this.basketService.areButtonsSimilar(oldButton, newButton);
        if (!similarButtons) {
          return false;
        }
      }
    }
    return true;
  }

  private orderDiscount(): number {
    const discountAmountButton = this.basketService.buttons.find((button) => button['$$OrderDiscount']);
    return discountAmountButton && Number.isInteger(discountAmountButton['$$OrderDiscount']) ? discountAmountButton['$$OrderDiscount'] : 0;
  }
}
