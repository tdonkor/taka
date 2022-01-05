import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AtpPaymentService, IPayProgress, PosRefintService, PosPaidState, PosTenderType, PosElogHandler } from 'dotsdk';
import { Subscription, from } from 'rxjs';

import { ApplicationSettingsService } from '../../../../services/app-settings.service';
import { CheckoutService } from '../../../../services/checkout.service';
import { DynamicContentService } from '../../../../services/dynamic-content/dynamic-content.service';
import { PaymentModelService } from '../../../../services/payment-model.service';

import { DotCdkTranslatePipe } from '../../../../pipes/dot-translate.pipe';
import { ConfirmDialogComponent } from '../../../../components/confirm-dialog/confirm-dialog.component';
import { isAdaEnabled } from '../../../../helpers/ada.helper';
import { CashInfoAction } from '../cash-info/glory-cash-info.component';
import { paymentLogger } from '../../../../../log-manager';

@Component({
  selector: 'acr-glory-payment-progress',
  templateUrl: './glory-payment-progress.component.html',
})
export class GloryPaymentProgressComponent implements OnInit, OnDestroy {
  public isAdaEnabled = isAdaEnabled;
  public subscriptions: Subscription[] = [];
  public isPaymentComplete = false;
  public hasError = false;
  // public showPrintButton = false;
  public disableButtons = true;
  public initialAmountOwed: number;

  public get totalAmountOwed(): number {
    return this.paymentModelService.getAmountThatCanBePaidWithCash();
  }
  public get amountPaidCurrent(): number {
    return this.paymentModelService.getCurrentAmountPaidWithCash();
  }
  public get amountDue(): number {
    return this.paymentModelService.getAmountThatCanBePaidWithCash() - this.paymentModelService.getCurrentAmountPaidWithCash();
  }
  public get cashPaymentName(): string {
    return this.appSettingsService.paymentTypes.find((p) => p.PaymentType === 'cash').PaymentName;
  }
  public get refInt(): string {
    return PosRefintService.getInstance()._refInt.toString();
  }
  constructor(
    protected router: Router,
    protected appSettingsService: ApplicationSettingsService,
    protected paymentModelService: PaymentModelService,
    protected checkoutService: CheckoutService,
    protected dynamicContentService: DynamicContentService,
    protected cdr: ChangeDetectorRef,
    protected ngZone: NgZone,
    protected translatePipe: DotCdkTranslatePipe
  ) {}

  public async ngOnInit() {
    this.initialAmountOwed = this.paymentModelService.getAmountOwed();
    // try to avoid collision between end accept money and start accept money
    // the cash machine needs some rest time between end accept money and start accept money
    setTimeout(async () => await this.startAcceptMoney(), 2000);
    // this.progressSubscriber = this.listenToPayProgress();
  }
  public ngOnDestroy() {
    // if (this.progressSubscriber) {
    //   this.progressSubscriber.unsubscribe();
    // }

    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public amountRefunded() {
    this.router.navigate(['glory-refund-progress']);
  }

  public async finishWithOtherPayment() {
    this.disableButtons = true;
    paymentLogger.debug(`Glory end accept money request: amountToKeep=${this.paymentModelService.getCashAmountToKeep()}, paymentName=${this.cashPaymentName}, params=null, transactionReference=${this.refInt} `);
    const endResult = await AtpPaymentService.getInstance().cashEndAcceptingMoney(
      this.paymentModelService.getCashAmountToKeep(), // amount to keep
      this.cashPaymentName,
      null,
      this.refInt
    );
    paymentLogger.debug(`Glory end accept money response: ${JSON.stringify(endResult, null, 2)}`);
    if (endResult && endResult.RefundAmount && endResult.RefundAmount > 0) {
      this.paymentModelService.setCashAmountRefunded(endResult.RefundAmount);
    }
    if (endResult && !endResult.Error) {
      if (this.paymentModelService.getCashAmountToKeep() > 0) {
        const cashTender = {
          paid: PosPaidState.PAID,
          type: PosTenderType.CASH,
          paymentMediaId: this.checkoutService.tenderMediaId,
          paidAmount: this.paymentModelService.getCurrentAmountPaidWithCash(),
        };
        PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders
          ? PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders.push(cashTender)
          : (PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders = [cashTender]);
      }
      this.paymentModelService.endCashTransaction();
      this.router.navigate(['payment-selection']);
    } else {
      this.paymentModelService.endCashTransaction();
      // this.paymentModelService.disableCashPaymentMethod();
      this.router.navigate(['payment-selection']);
    }
  }

  public async cancel() {
    this.disableButtons = true;
    if (this.paymentModelService.getCurrentAmountPaidWithCash() === 0) {
      paymentLogger.debug(`Glory end accept money request: amountToKeep=0, paymentName=${this.cashPaymentName}, params=null, transactionReference=${this.refInt} `);
      const endResult = await AtpPaymentService.getInstance().cashEndAcceptingMoney(
        0, // amount to keep
        this.cashPaymentName,
        null,
        this.refInt
      );
      paymentLogger.debug(`Glory end accept money response: ${JSON.stringify(endResult, null, 2)}`);
      if (endResult && endResult.RefundAmount && endResult.RefundAmount > 0) {
        this.paymentModelService.setCashAmountRefunded(endResult.RefundAmount);
      }
      // if (!endResult || endResult.Error) {
      //   // this.paymentModelService.disableCashPaymentMethod();
      // }
      this.router.navigate(['payment-selection']);
      return;
    }
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: this.translatePipe.transform('2021022602'),
      rightButtonText: this.translatePipe.transform('33'),
      leftButtonText: this.translatePipe.transform('32'),
    });
    this.subscriptions.push(
      contentRef.afterClosed.subscribe(async (response) => {
        if (response === 'Yes') {
          this.router.navigate(['glory-cash-info', CashInfoAction.CANCEL]);
        } else {
          this.disableButtons = false;
        }
      })
    );
  }

  public printReceipt() {
    this.paymentModelService.endCashTransaction();
    this.router.navigate(['glory-cash-info', CashInfoAction.PRINT]);
  }

  protected async startAcceptMoney() {
    paymentLogger.debug(`Glory start accept money request: ${this.cashPaymentName}`);
    let startResult;
    startResult = await AtpPaymentService.getInstance().cashStartAcceptingMoney(this.cashPaymentName);
    paymentLogger.debug(`Glory start accept money response: ${JSON.stringify(startResult, null, 2)}`);
    if (!startResult || startResult.Error) {
      // this._hasError = true;
      this.router.navigate(['payment-selection']);
    }
    this.subscriptions.push(this.listenForPaymentProgressAndCompletion());
    this.disableButtons = false;
  }

  protected listenForPaymentProgressAndCompletion(): Subscription {
    paymentLogger.debug(`Glory pay progress subscription starting...`);
    return from(AtpPaymentService.getInstance().payProgress()).subscribe((paymentInfo: IPayProgress) => {
      paymentLogger.debug(`Pay progress response: ${JSON.stringify(paymentInfo, null, 2)}`);
      if (paymentInfo.MessageClass === 'Error') {
        this.hasError = true;
        this.cdr.detectChanges();
        // this._showPrintButton = true;
      } else {
        this.paymentModelService.setCurrentAmountPaidWithCash(paymentInfo.CurrentPaidAmount);
        if (this.paymentModelService.getAmountThatCanBePaidWithCash() - paymentInfo.CurrentPaidAmount === 0) {
          paymentLogger.debug(`Glory pay progress finished: PAID THE EXACT AMOUNT`);
          if (!this.isPaymentComplete) {
            this.isPaymentComplete = true;
            this.onPaymentComplete();
          }
        } else if (this.paymentModelService.getAmountThatCanBePaidWithCash() - paymentInfo.CurrentPaidAmount < 0) {
          paymentLogger.debug(`Glory pay progress finished: PAID OVER THE AMOUNT`);
          paymentLogger.debug(`Glory pay progress finished: Glory response payment info: ${JSON.stringify(paymentInfo, null, 2)}`);
          if (!this.isPaymentComplete) {
            this.isPaymentComplete = true;
            this.ngZone.run(() => {
              this.router.navigate(['glory-cash-info', CashInfoAction.OVERPAY]);
            });
          }
        } else {
          this.cdr.detectChanges();
        }
      }
    });
  }

  protected async onPaymentComplete() {
    paymentLogger.debug(`Glory end accept money request: amountToKeep=${this.paymentModelService.getCashAmountToKeep()}, paymentName=${this.cashPaymentName}, params=null, transactionReference=${this.refInt} `);
    this.disableButtons = true;
    const endResult = await AtpPaymentService.getInstance().cashEndAcceptingMoney(
      this.paymentModelService.getCashAmountToKeep(), // amount to keep
      this.cashPaymentName,
      null,
      this.refInt
    );
    paymentLogger.debug(`Glory end accept money response: ${JSON.stringify(endResult, null, 2)}`);
    if (endResult && endResult.RefundAmount && endResult.RefundAmount > 0) {
      this.paymentModelService.setCashAmountRefunded(endResult.RefundAmount);
    }
    // if (!endResult || endResult.Error) {
    //   // this.paymentModelService.disableCashPaymentMethod();
    // }
    const cashTender = {
      paid: PosPaidState.PAID,
      type: PosTenderType.CASH,
      paymentMediaId: this.checkoutService.tenderMediaId,
      paidAmount: this.paymentModelService.getCashAmountToKeep(),
    };
    PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders
      ? PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders.push(cashTender)
      : (PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders = [cashTender]);
    this.paymentModelService.endCashTransaction();
    if (
      this.initialAmountOwed >
      this.paymentModelService.getTotalAmountPaidWithCash() +
        this.paymentModelService.getCurrentAmountPaidWithCash() +
        this.paymentModelService.getTotalAmountPaidWithGift()
    ) {
      this.ngZone.run(() => {
        this.router.navigate(['payment-selection']);
      });
    } else {
      this.ngZone.run(() => {
        if (this.checkoutService.openedOrder) {
          this.router.navigate(['tender-order']);
        } else {
          this.router.navigate(['complete-order']);
        }
      });
    }
  }
}
