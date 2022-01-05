import { Injectable } from '@angular/core';
import { DotCdkTranslatePipe } from '../../pipes/dot-translate.pipe';
import { getMultipleLineText } from '../../helpers/text-receipt.helper';
import { ApplicationSettingsService } from '../app-settings.service';
import { CheckoutService } from '../checkout.service';
import { LocalizationService } from '../localization.service';
import { PaymentModelService } from '../payment-model.service';
import { PrintReceiptBuilder } from './print-receipt-builder.service';

@Injectable({
  providedIn: 'root'
})
export class OrderTotalsService {
  constructor(
    protected paymentModelService: PaymentModelService,
    protected appSettingsService: ApplicationSettingsService,
    private printReceiptBuilder: PrintReceiptBuilder,
    private translatePipe: DotCdkTranslatePipe,
    private localizationService: LocalizationService,
    private checkoutService: CheckoutService
  ) { }

  public get totalAmountPaidWithCash(): number {
    return this.paymentModelService.getTotalAmountPaidWithCash() + this.paymentModelService.getCashAmountRefunded();
  }
  public get changeDue(): number {
    const cashOrderTotal = this.checkoutService.orderTotal - this.paymentModelService.getTotalAmountPaidWithGift() - this.paymentModelService.getAmountPaidWithCard() <= parseFloat(this.appSettingsService.gloryPayableAmount) ?
                            this.checkoutService.orderTotal - this.paymentModelService.getTotalAmountPaidWithGift() - this.paymentModelService.getAmountPaidWithCard() :
                            parseFloat(this.appSettingsService.gloryPayableAmount);
    if (cashOrderTotal > this.totalAmountPaidWithCash) {
      return this.totalAmountPaidWithCash;
    }
    return this.totalAmountPaidWithCash - cashOrderTotal;
  }

  public printOrderTotals() {
    if (this.totalAmountPaidWithCash !== 0) {
      if (this.paymentModelService.getAmountPaidWithCard() > 0) {
        this.printReceiptBuilder.addContent(
          this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021030101'), 15, false) + ' ' +
          this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.orderTotal - this.totalAmountPaidWithCash), 25, false));
        this.printReceiptBuilder.newLine(1);
      }
      this.printReceiptBuilder.addContent(
        this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021022501'), 15, false) + ' ' +
        this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.totalAmountPaidWithCash), 25, false));
      this.printReceiptBuilder.newLine(2);
     }
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021020503'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.taxCents), 30, false));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021020504'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.subtotalCents), 30, false));
    this.printReceiptBuilder.newLine(1);


    const total = (this.totalAmountPaidWithCash !== 0) ? this.translatePipe.transform('2021030102') : this.translatePipe.transform('63');
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(total, 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.orderTotal), 30, false));
    this.printReceiptBuilder.newLine(1);

    if ( this.totalAmountPaidWithCash !== 0 ) {
      this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021022503'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.changeDue), 30, false));
      this.printReceiptBuilder.newLine(1);
    }

    return this.printReceiptBuilder.getContent;
  }

  public printRefundFail(refundFail: boolean) {
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021020503'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.taxCents), 30, false));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021020504'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.subtotalCents), 30, false));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('63'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.checkoutService.orderTotal), 30, false));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021030103'), 25, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.totalAmountPaidWithCash), 15, false));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021030104'), 10, false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(0), 30, false));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToLeft(this.translatePipe.transform('2021030105'), 25,  false) + ' ' +
      this.printReceiptBuilder.alignToRight(this.localizationService.formatCurrency(this.changeDue), 15, false));
    this.printReceiptBuilder.newLine(2);
    this.printReceiptBuilder.toCenter('on');
    (refundFail === true) ?
      this.printReceiptBuilder.addContent(getMultipleLineText(this.translatePipe.transform('2021030106'))) :
      this.printReceiptBuilder.addContent(getMultipleLineText(this.translatePipe.transform('2021030107')));
    this.printReceiptBuilder.newLine(2);
    return this.printReceiptBuilder.getContent;
  }
}
