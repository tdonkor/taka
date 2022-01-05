import { CheckoutType, PaymentFailType } from '@dotxix/models';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PosElogHandler, PosOperationDevicesTypes } from 'dotsdk';

import { ApplicationSettingsService } from '../../../services/app-settings.service';
import { CashInfoAction } from '../glory/cash-info/glory-cash-info.component';
import { CheckoutService } from '../../../services/checkout.service';
import { DotCdkTranslatePipe } from '../../../pipes/dot-translate.pipe';
import { DynamicContentService } from '../../../services/dynamic-content/dynamic-content.service';
import { PaymentModelService } from '../../../services/payment-model.service';
import { PaymentProgressService } from './payment-progress.service';
import { PaymentRetryComponent } from '../../../components/payment-retry/payment-retry.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'acr-payment-progress',
  templateUrl: 'payment-progress.component.html',
})
export class PaymentProgressComponent implements OnInit, OnDestroy {
  public static PageID = '-10';
  private contentRefSubscription: Subscription;

  constructor(
    protected appSettingsService: ApplicationSettingsService,
    protected checkoutService: CheckoutService,
    protected translatePipe: DotCdkTranslatePipe,
    protected dynamicContentService: DynamicContentService,
    protected router: Router,
    protected paymentModelService: PaymentModelService,
    protected payProgressService: PaymentProgressService
  ) {}

  public async ngOnInit() {
    await this.payWithCard();
  }

  public async ngOnDestroy() {
    if (this.contentRefSubscription) {
      this.contentRefSubscription.unsubscribe();
    }
  }

  public async payWithCard() {
    PosElogHandler.getInstance().posConfig.posHeader.payStartTime = PosElogHandler.getInstance().posConfig.posHeader.payStartTime
      ? PosElogHandler.getInstance().posConfig.posHeader.payStartTime
      : new Date();
    const resultCardPayment = await this.payProgressService.sendOrderToCardPay();

    PosElogHandler.getInstance().posConfig.posHeader.payEndTime = new Date();

    if (resultCardPayment === 'orderNotPaid') {
      this.populateElogFailPay();
      if (this.appSettingsService.paymentFailRedirect === PaymentFailType.PAY_SELECTION) {
        if (this.checkoutService.paymentRetries > 0) {
          --this.checkoutService.paymentRetries;
          this.router.navigate(['payment-selection']);
        } else if (this.paymentModelService.getTotalAmountPaidWithCash() > 0) {
          this.router.navigate(['glory-cash-info', CashInfoAction.CASHBACK]);
        } else {
          this.router.navigate(['checkout-error', { posOperation: 'void-order', displayPaymentImage: 'true' }]);
        }
      } else {
        // paymentFailRedirect === PAY_RETRY
        if (this.checkoutService.paymentRetries > 0) {
          const contentRef = this.dynamicContentService.openContent(PaymentRetryComponent, {
            title: this.translatePipe.transform('30'),
            message: this.translatePipe.transform('31'),
            counter: this.appSettingsService.paymentRetryCounter,
            rightButtonText: this.translatePipe.transform('33'),
            leftButtonText: this.translatePipe.transform('32'),
          });
          this.contentRefSubscription = contentRef.afterClosed.subscribe(async (response) => {
            if (response === 'Yes') {
              --this.checkoutService.paymentRetries;
              this.contentRefSubscription.unsubscribe();
              await this.payWithCard();
            } else if (this.paymentModelService.getTotalAmountPaidWithCash() > 0) {
              this.router.navigate(['glory-cash-info', CashInfoAction.CASHBACK]);
            } else {
              this.router.navigate(['checkout-error', { posOperation: 'void-order', displayPaymentImage: 'true' }]);
            }
          });
        } else if (this.paymentModelService.getTotalAmountPaidWithCash() > 0) {
          this.router.navigate(['glory-cash-info', CashInfoAction.CASHBACK]);
        } else {
          this.router.navigate(['checkout-error', { posOperation: 'void-order', displayPaymentImage: 'true' }]);
        }
      }
    } else {
      // Payment with Success:
      this.appSettingsService.posInjectionFlow === CheckoutType.PAY_AFTER_POS
        ? this.router.navigate(['tender-order'])
        : this.router.navigate(['complete-order']);
    }
  }

  protected populateElogFailPay() {
    PosElogHandler.getInstance().posConfig.posHeader.operations.push({
      deviceType: PosOperationDevicesTypes.PAY,
      time: new Date(),
      id: '1',
      name: 'PAY 1',
      operation: 'DoPayment',
      status: 0,
      code: 1,
    });
  }
}
