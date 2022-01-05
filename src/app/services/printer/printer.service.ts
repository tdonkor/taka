import { ApplicationSettingsService } from '../app-settings.service';
import { AtpPrinterService } from 'dotsdk';
import { CheckoutService } from '../checkout.service';
import { HeaderReceiptService } from './header-receipt.service';
import { Injectable } from '@angular/core';
import { LocalizationService } from '../localization.service';
import { OrderContentReceiptService } from './order-content-receipt.service';
import { OrderTotalsService } from './order-totals.service';
import { PaymentModelService } from '../payment-model.service';
import { PosFooterReceiptService } from './pos-footer-receipt.service';
import { PrintReceiptBuilder } from './print-receipt-builder.service';
import { SessionService } from '../session.service';
import { TranslationsService } from '../translations/translations.service';
import { getMultipleLineText } from '../../helpers/text-receipt.helper';

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  public isCardPayment: boolean;
  private orderNumber;

  constructor(
    protected printReceiptBuilder: PrintReceiptBuilder,
    protected checkoutService: CheckoutService,
    protected sessionService: SessionService,
    protected localizationService: LocalizationService,
    protected headerReceiptService: HeaderReceiptService,
    protected orderContentService: OrderContentReceiptService,
    protected posFooterReceiptService: PosFooterReceiptService,
    protected orderTotalsService: OrderTotalsService,
    protected applicationSettings: ApplicationSettingsService,
    protected paymentModelService: PaymentModelService,
    protected translationsService: TranslationsService
  ) {}

  public async printReceipt(transactionFailure: boolean) {
    const oldLanguage = this.translationsService.currentLanguage.code;
    this.translationsService.saveSnapshot();
    this.translationsService.setCurrentLanguage(this.applicationSettings.defaultLanguage);
    const amountInsertedInCashMachine = (
      this.paymentModelService.getTotalAmountPaidWithCash() + this.paymentModelService.getCashAmountRefunded()
    ).toString();
    const receiptContent = this.buildReceipt(
      this.checkoutService.orderPOSNumber.toString(),
      amountInsertedInCashMachine,
      transactionFailure
    );
    await AtpPrinterService.getInstance()
      .print(receiptContent)
      .catch((e) => null);
    this.printReceiptBuilder.clearContent();
    this.translationsService.setCurrentLanguage(oldLanguage);
  }

  public buildReceipt(orderNumber: string, orderTotal: string, transferFailure: boolean): string {
    this.orderNumber = orderNumber;
    const oldLanguage = this.translationsService.currentLanguage.code;
    this.translationsService.setCurrentLanguage(this.applicationSettings.defaultLanguage);
    this.printReceiptBuilder.clearContent();
    if (
      !this.applicationSettings.printPOSReceipt ||
      !this.checkoutService.receiptContent ||
      this.paymentModelService.getTotalAmountPaidWithCash() > 0
    ) {
      this.headerReceiptService.getReceiptHeader(this.orderNumber);
      this.orderContentService.getOrderContent();
      this.orderTotalsService.printOrderTotals();
    } else {
      this.printReceiptBuilder.newLine(1);
      this.printReceiptBuilder.addContent(this.checkoutService.receiptContent);
      this.printReceiptBuilder.newLine(1);
    }
    if (transferFailure) {
      this.posFooterReceiptService.getPosFooterReceipt();
    }
    if (this.checkoutService.receiptPayAtCounter) {
      this.printReceiptBuilder.newLine(1);
      this.printReceiptBuilder.addContent(getMultipleLineText(this.checkoutService.receiptPayAtCounter));
    }
    this.printReceiptBuilder.newLine(1);
    this.posFooterReceiptService.addCheckClosedOnReceipt();
    if (!this.checkoutService.receiptPayAtCounter) {
      if (
        this.applicationSettings.receiptEFTPartialCut &&
        (this.paymentModelService.getAmountPaidWithCard() > 0 || this.paymentModelService.getTotalAmountPaidWithGift() > 0)
      ) {
        this.printReceiptBuilder.cut();
      }
      this.printReceiptBuilder.addContent('<@PaymentCustomerReceipt>');
    }
    this.printReceiptBuilder.newLine(2);

    this.printReceiptBuilder.newLine(5);
    this.printReceiptBuilder.cut();
    this.translationsService.setCurrentLanguage(oldLanguage);
    return this.printReceiptBuilder.getContent;
  }

  public buildErrorsCashMachineReceipt(refundFail: boolean) {
    const oldLanguage = this.translationsService.currentLanguage.code;
    this.translationsService.setCurrentLanguage(this.applicationSettings.defaultLanguage);
    // this.languageService.recoverFromSnapShot();
    this.orderNumber = this.checkoutService.orderPOSNumber ? this.checkoutService.orderPOSNumber.toString() : '0';
    this.printReceiptBuilder.clearContent();
    this.headerReceiptService.getReceiptHeader(this.orderNumber);
    this.orderContentService.getOrderContent();
    this.orderTotalsService.printRefundFail(refundFail);
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.newLine(5);
    this.printReceiptBuilder.cut();
    this.translationsService.setCurrentLanguage(oldLanguage);
    return this.printReceiptBuilder.getContent;
  }
}
