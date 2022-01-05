import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isAdaEnabled, log, routeToFirstPage } from '@dotxix/helpers';
import {
  ApplicationSettingsService,
  CheckoutService,
  PaymentModelService,
  PosOperationsService,
  PrinterService,
  PrintReceiptBuilder,
  SessionEndType,
  SessionService,
} from '@dotxix/services';
import {
  AtpPaymentService,
  AtpPrinterService,
  cancelOrderEvent,
  PosRefintService,
  PosPaidState,
  PosTenderType,
  PosElogHandler,
} from 'dotsdk';

import { Subscription } from 'rxjs';
import { paymentLogger } from '../../../../../log-manager';

export enum CashInfoAction {
  OVERPAY = 'overpay',
  CASHBACK = 'cashback',
  CANCEL = 'cancel',
  PRINT = 'print',
}
@Component({
  selector: 'acr-glory-cash-info',
  templateUrl: './glory-cash-info.component.html',
})
export class GloryCashInfoComponent implements OnInit, OnDestroy {
  public isAdaEnabled = isAdaEnabled;
  public actionType: string;
  public displayButtonsOnError = false;
  public text: { title: string; message: string; amount: number };
  public subscriptions: Subscription[] = [];
  public get refInt(): string {
    return PosRefintService.getInstance()._refInt.toString();
  }
  public get cashPaymentName(): string {
    return this.appSettings.paymentTypes.find((p) => p.PaymentType === 'cash').PaymentName;
  }
  public get cashPaid(): number {
    if (this.actionType === CashInfoAction.CASHBACK || this.actionType === CashInfoAction.PRINT) {
      return this.paymentModelService.getTotalAmountPaidWithCash();
    }
    return this.paymentModelService.getCurrentAmountPaidWithCash();
  }
  public get returnedAmount(): number {
    return this.paymentModelService.getCashAmountRefunded();
  }
  public get changeDue(): number {
    return this.paymentModelService.getCurrentAmountPaidWithCash() - this.paymentModelService.getAmountThatCanBePaidWithCash();
  }
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    protected sessionService: SessionService,
    protected printerService: PrinterService,
    protected posOperationService: PosOperationsService,
    protected printReceiptBuilder: PrintReceiptBuilder,
    protected checkoutService: CheckoutService,
    protected appSettings: ApplicationSettingsService,
    protected paymentModelService: PaymentModelService
  ) {}

  public async ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        this.actionType = params.get('action');
        this.text = { title: '2021022501', message: '2021022404', amount: this.cashPaid };
        switch (this.actionType) {
          case CashInfoAction.OVERPAY:
            await this.overpayEndAcceptMoney().catch((e) => log('overpay refund error: ', e));
            break;
          case CashInfoAction.CANCEL:
            await this.cancelEndAcceptMoney().catch((e) => log('cancel error', e));
            break;
          case CashInfoAction.CASHBACK:
            await this.cashBack().catch((e) => log('cashback error: ', e));
            break;
          case CashInfoAction.PRINT:
            this.text.message = '2021022502';
            await this.printReceipt();
            break;
        }
      })
    );
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
  public continueClick() {
    this.paymentModelService.endCashTransaction();
    this.router.navigate(['payment-selection']);
  }
  public printReceiptClick() {
    this.router.navigate(['glory-cash-info', CashInfoAction.PRINT]);
  }
  public async cashBack() {
    if (this.checkoutService.openedOrder) {
      // await this.posOperationService.sendVoidOrderToPOS();
      this.checkoutService.openedOrder = !(await this.posOperationService.sendVoidOrderToPOS());
    }
    paymentLogger.debug(`Glory cashback request: transactionReference=${this.refInt}, paymentName=${this.cashPaymentName}`);
    const cashBackResult = await AtpPaymentService.getInstance()
      .cashBack(this.refInt, this.cashPaymentName)
      .catch((e) => {
        log('error on cashback call: ', e);
        return e;
      });
    paymentLogger.debug(`Glory cashback response: ${JSON.stringify(cashBackResult, null, 2)}`);
    if (cashBackResult.Error) {
      this.router.navigate(['glory-cash-info', CashInfoAction.PRINT]);
    } else if (
      cashBackResult.Response.ReturnedAmount < cashBackResult.Response.AmountToBeReturned ||
      cashBackResult.Response.ReturnedAmount < this.paymentModelService.getTotalAmountPaidWithCash()
    ) {
      this.router.navigate(['glory-cash-info', CashInfoAction.PRINT]);
    } else {
      this.paymentModelService.setCashAmountRefunded(cashBackResult.Response.ReturnedAmount);
      this.text = { title: '2021022402', message: '2021022403', amount: this.returnedAmount };
      setTimeout(async () => {
        await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
        cancelOrderEvent.emit(null);
        this.paymentModelService.endCashTransaction();
        this.router.navigate([routeToFirstPage()]);
      }, 3000);
    }
  }

  public async overpayEndAcceptMoney() {
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
    const cashTender = {
      paid: PosPaidState.PAID,
      type: PosTenderType.CASH,
      paymentMediaId: this.checkoutService.tenderMediaId,
      paidAmount: this.paymentModelService.getCashAmountToKeep(),
    };
    this.paymentModelService.setCurrentAmountPaidWithCash(endResult.PaidAmount);
    PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders
      ? PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders.push(cashTender)
      : (PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders = [cashTender]);
    if (endResult && !endResult.Error) {
      if (
        this.paymentModelService.getAmountOwed() >
        this.paymentModelService.getTotalAmountPaidWithCash() +
          this.paymentModelService.getCurrentAmountPaidWithCash() +
          this.paymentModelService.getTotalAmountPaidWithGift()
      ) {
        this.text = { title: '2021022402', message: '2021022403', amount: this.returnedAmount };
        // wait 3000 milliseconds for payment progress before calculating amounts
        setTimeout(() => {
          this.paymentModelService.endCashTransaction();
          this.router.navigate(['payment-selection']);
        }, 3000);
        return;
      } else if (
        this.paymentModelService.getCashAmountRefunded() >=
        this.paymentModelService.getCurrentAmountPaidWithCash() - this.paymentModelService.getCashAmountToKeep()
      ) {
        this.text = { title: '2021022402', message: '2021022403', amount: this.returnedAmount };
      } else {
        this.text = { title: '2021022503', message: '2021022405', amount: this.changeDue };
      }
    } else {
      // this.paymentModelService.disableCashPaymentMethod();
      this.text = { title: '2021022503', message: '2021022405', amount: this.changeDue };
    }
    setTimeout(() => {
      this.paymentModelService.endCashTransaction();
      if (this.checkoutService.openedOrder) {
        this.router.navigate(['tender-order']);
      } else {
        this.router.navigate(['complete-order']);
      }
    }, 3000);
  }

  public async cancelEndAcceptMoney() {
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
    if (endResult && !endResult.Error) {
      if (this.paymentModelService.getCurrentAmountPaidWithCash() > 0) {
        this.paymentModelService.endCashTransaction();
        this.text = { title: null, message: '2021022504', amount: null };
        this.displayButtonsOnError = true;
      } else {
        this.text = { title: '2021022402', message: '2021022403', amount: this.returnedAmount };
        setTimeout(() => {
          this.paymentModelService.endCashTransaction();
          this.router.navigate(['payment-selection']);
        }, 3000);
      }
    } else {
      // this.paymentModelService.disableCashPaymentMethod();
      this.paymentModelService.endCashTransaction();
      this.text = { title: null, message: '2021022504', amount: null };
      this.displayButtonsOnError = true;
    }
  }
  public async printReceipt() {
    if (this.checkoutService.openedOrder) {
      // await this.posOperationService.sendVoidOrderToPOS();
      this.checkoutService.openedOrder = !(await this.posOperationService.sendVoidOrderToPOS());
    }
    this.checkoutService.receiptContent = this.printerService.buildErrorsCashMachineReceipt(false);
    await AtpPrinterService.getInstance()
      .print(this.checkoutService.receiptContent)
      .catch((e) => null);
    this.printReceiptBuilder.clearContent();
    setTimeout(async () => {
      await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
      cancelOrderEvent.emit(null);
      this.paymentModelService.endCashTransaction();
      this.router.navigate([routeToFirstPage()]);
    }, 3000);
  }
}
