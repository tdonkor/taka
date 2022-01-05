import { AtpPrinterService, SectionAvailability, cancelOrderEvent } from 'dotsdk';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { SessionEndType, SessionService } from '../../../services/session.service';

import { ApplicationSettingsService } from '../../../services/app-settings.service';
import { CashInfoAction } from '../glory/cash-info/glory-cash-info.component';
import { CheckoutService } from '../../../services/checkout.service';
import { CheckoutType } from '../../../models/enums/checkout-type.enum';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { ContentService } from '../../../services/content.service';
import { DotCdkTranslatePipe } from '../../../pipes/dot-translate.pipe';
import { DynamicContentService } from '../../../services/dynamic-content/dynamic-content.service';
import { PAYMENT_TYPE } from '../../../models/enums/payment-type.enum';
import { PaymentModelService } from '../../../services/payment-model.service';
import { PaymentType } from '../../../models/interfaces/payment.interface';
import { PosOperationsService } from '../../../services/pos-operations.service';
import { PrintReceiptBuilder } from '../../../services/printer/print-receipt-builder.service';
import { PrinterService } from '../../../services/printer/printer.service';
import { Router } from '@angular/router';
import { StatusService } from '../../../services/status.service';
import { Subscription } from 'rxjs';
import { TranslationsService } from '../../../services/translations/translations.service';
import { WorkingHoursService } from '../../../services/working-hours.service';
import { isAdaEnabled } from '../../../helpers/ada.helper';
import { routeToFirstPage } from '../../../helpers/first-page.helper';

@Component({
  selector: 'acr-payment-selection',
  templateUrl: './payment-selection.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class PaymentSelectionComponent implements OnInit, OnDestroy {
  public isAdaEnabled = isAdaEnabled;
  public PAYMENT_TYPE = PAYMENT_TYPE;
  public whPreOrderEnabled = true;
  public subscriptions: Subscription[] = [];

  public get availablePayments(): PaymentType[] {
    if (!this.whPreOrderEnabled) {
      return this.statusService.paymentsAvailableForApp.filter((payment) => payment.PaymentType !== PAYMENT_TYPE.PREORDER);
    }
    return this.statusService.paymentsAvailableForApp;
  }
  public get amountOwed(): number {
    return this.paymentModelService.getAmountOwed();
  }

  constructor(
    protected router: Router,
    protected checkoutService: CheckoutService,
    protected printReceiptBuilder: PrintReceiptBuilder,
    protected paymentModelService: PaymentModelService,
    protected contentService: ContentService,
    protected appSettingsService: ApplicationSettingsService,
    protected sessionService: SessionService,
    protected dynamicContentService: DynamicContentService,
    protected posOperationService: PosOperationsService,
    protected translatePipe: DotCdkTranslatePipe,
    protected printerService: PrinterService,
    protected statusService: StatusService,
    public workingHoursService: WorkingHoursService,
    protected translationService: TranslationsService
  ) {}

  public async ngOnInit() {
    // console.log('payments available: ', this.statusService.enabledPayments);
    const response = this.workingHoursService.getSectionResponse(SectionAvailability.PRE_ORDER);
    if (response && 'PreOrderEnabled' in response && response.PreOrderEnabled !== undefined) {
      this.whPreOrderEnabled = response.PreOrderEnabled;
    }
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public isPaymentDisabled(payment: PaymentType): boolean {
    if (payment.PaymentType === PAYMENT_TYPE.CASH) {
      return this.paymentModelService.getTotalAmountPaidWithCash() >= parseFloat(this.appSettingsService.gloryPayableAmount);
    }
    return false;
  }

  public orderPay(payment: PaymentType) {
    this.translationService.saveSnapshot();
    this.checkoutService.paymentType = payment.PaymentType;
    switch (payment.PaymentType) {
      case PAYMENT_TYPE.CARD: {
        if (!this.checkoutService.openedOrder && this.appSettingsService.posInjectionFlow === CheckoutType.PAY_AFTER_POS) {
          this.router.navigate(['open-order']);
        } else {
          this.router.navigate(['payment-progress']);
        }
        break;
      }
      case PAYMENT_TYPE.CASH: {
        if (this.checkoutService.orderTotal > parseFloat(this.appSettingsService.gloryPayableAmount)) {
          this.router.navigate(['glory-legal-requirements']);
        } else if (!this.checkoutService.openedOrder && this.appSettingsService.posInjectionFlow === CheckoutType.PAY_AFTER_POS) {
          this.router.navigate(['open-order']);
        } else {
          this.router.navigate(['glory-payment-progress']);
        }
        break;
      }
      case PAYMENT_TYPE.PREORDER: {
        if (!this.checkoutService.openedOrder && this.appSettingsService.posInjectionFlow !== CheckoutType.PAY_BEFORE_POS) {
          this.router.navigate(['open-order']);
        } else {
          this.sendToFrontCounter();
        }
      }
    }
  }
  public async cancel(ev: MouseEvent) {
    if (this.paymentModelService.getTotalAmountPaidWithCash() > 0) {
      const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
        title: this.translatePipe.transform('2021022602'),
        rightButtonText: this.translatePipe.transform('33'),
        leftButtonText: this.translatePipe.transform('32'),
      });
      this.subscriptions.push(
        contentRef.afterClosed.subscribe(async (response) => {
          if (response === 'Yes') {
            if (this.checkoutService.openedOrder) {
              this.checkoutService.openedOrder = !(await this.posOperationService.sendVoidOrderToPOS());
            }
            this.router.navigate(['glory-cash-info', CashInfoAction.CASHBACK]);
          }
        })
      );
    } else {
      if (this.checkoutService.openedOrder) {
        this.checkoutService.openedOrder = !(await this.posOperationService.sendVoidOrderToPOS());
      }
      await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
      cancelOrderEvent.emit(ev);
      this.router.navigate([routeToFirstPage()]);
    }
  }
  protected async sendToFrontCounter() {
    // todo print ticket with not paid order
    const oldLanguage = this.translationService.currentLanguage.code;
    this.translationService.setCurrentLanguage(this.appSettingsService.defaultLanguage);
    this.checkoutService.receiptPayAtCounter = this.translatePipe.transform('2021020801');
    this.translationService.setCurrentLanguage(oldLanguage);
    const receipt = this.printerService.buildReceipt(
      this.checkoutService.orderPOSNumber.toString(),
      (this.checkoutService.orderTotal / 100).toFixed(2),
      false
    );
    this.router.navigate(['preorder']);
    await AtpPrinterService.getInstance()
      .print(receipt)
      .catch((e) => null);
    this.printReceiptBuilder.clearContent();
    if (this.appSettingsService.unlockOrder) {
      await this.posOperationService.sendUnlockOrderToPOS();
    }
  }
}
