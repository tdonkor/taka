import { CashPaymentModel, GiftPaymentModel } from '../models';

import { ApplicationSettingsService } from './app-settings.service';
import { CheckoutService } from './checkout.service';
import { Injectable } from '@angular/core';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentModelService {
  protected _isCashPaymentDisabled = false;
  protected _isGiftPaymentDisabled = false;
  protected _card = 0;
  protected _cash: CashPaymentModel = {
    amountPaidCurrent: 0,
    amountPaidTotal: 0,
    amountRefunded: 0,
    initialAmountThatCanBePaidWithCash: 0,
  };
  protected _gift: GiftPaymentModel = {
    amountPaidCurrent: 0,
    amountPaidTotal: 0,
  };
  protected _currentPaymentMethod: string;

  public get isCashPaymentDisabled(): boolean {
    if (this._cash.amountPaidTotal >= parseFloat(this.appSettings.gloryPayableAmount)) {
      return true;
    }
    return false;
  }
  public get isGiftPaymentDisabled(): boolean {
    return this._isGiftPaymentDisabled;
  }
  public get initialAmountThatCanBePaidWithCash(): number {
    return this._cash.initialAmountThatCanBePaidWithCash;
  }

  constructor(
    protected checkoutService: CheckoutService,
    protected appSettings: ApplicationSettingsService,
    protected sessionService: SessionService
  ) {
    this.sessionService.onRestartSession.subscribe((x) => {
      this.resetPaymentModel();
    });
  }

  public getAmountPaidWithCard(): number {
    return this._card;
  }
  public setAmountPaidWithCard(newAmount: number) {
    this._card = newAmount;
  }
  public getCurrentPaymentMethod(): string {
    return this._currentPaymentMethod;
  }
  public setCurrentPaymentMethod(newPaymentMethod: string) {
    this._currentPaymentMethod = newPaymentMethod;
  }
  public getTotalAmountPaidWithCash(): number {
    return this._cash.amountPaidTotal;
  }
  public setCurrentAmountPaidWithCash(currentAmountPaid: number) {
    this._cash.amountPaidCurrent = currentAmountPaid;
  }
  public getCurrentAmountPaidWithCash(): number {
    return this._cash.amountPaidCurrent;
  }
  public resetCurrentCashPaid() {
    this._cash.amountPaidCurrent = 0;
  }
  public getCashAmountRefunded(): number {
    return this._cash.amountRefunded;
  }
  public setCashAmountRefunded(refundAmount: number) {
    this._cash.amountRefunded = refundAmount;
    if (this._cash.amountPaidCurrent >= this._cash.amountRefunded) {
      this._cash.amountPaidCurrent -= refundAmount;
    }
  }
  public getCashAmountToKeep(): number {
    if (this._cash.amountPaidCurrent > this.getAmountThatCanBePaidWithCash()) {
      return this._cash.amountPaidCurrent - (this._cash.amountPaidCurrent - this.getAmountThatCanBePaidWithCash());
    }
    return this._cash.amountPaidCurrent;
  }
  public endCashTransaction() {
    if (this._cash.amountPaidCurrent <= 0) {
      this._cash.amountRefunded = 0;
    }
    this._cash.amountPaidTotal += this._cash.amountPaidCurrent;
    this._cash.amountPaidCurrent = 0;
  }
  public getTotalAmountPaidWithGift(): number {
    return this._gift.amountPaidTotal;
  }
  public updateTotalGiftPaid(amountChanged: number) {
    this._gift.amountPaidTotal += amountChanged;
  }
  public getCurrentAmountPaidWithGift(): number {
    return this._gift.amountPaidCurrent;
  }
  public resetCurrentGiftPaid() {
    this._gift.amountPaidCurrent = 0;
  }
  public getAmountOwed() {
    return this.checkoutService.orderTotal - (this._cash.amountPaidTotal + this._gift.amountPaidTotal);
  }
  public getAmountThatCanBePaidWithCash(): number {
    if (this.getAmountOwed() > parseFloat(this.appSettings.gloryPayableAmount) - this._cash.amountPaidTotal) {
      return parseFloat(this.appSettings.gloryPayableAmount) - this._cash.amountPaidTotal;
    }
    return this.getAmountOwed();
  }
  public resetPaymentModel() {
    this._currentPaymentMethod = '';
    this._card = 0;
    this._cash = {
      amountPaidCurrent: 0,
      amountPaidTotal: 0,
      amountRefunded: 0,
      initialAmountThatCanBePaidWithCash: 0,
    };
    this._gift = {
      amountPaidCurrent: 0,
      amountPaidTotal: 0,
    };
    this.setInitialAmountThatCanBePaidWithCash();
  }
  public setInitialAmountThatCanBePaidWithCash() {
    this._cash.initialAmountThatCanBePaidWithCash = this.getAmountThatCanBePaidWithCash();
  }
}
