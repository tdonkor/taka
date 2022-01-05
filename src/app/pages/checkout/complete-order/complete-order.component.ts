import { Component, OnInit, Injector } from '@angular/core';
import { PosElogHandler, PosInjectorService, AtpPrinterService } from 'dotsdk';

import { Router } from '@angular/router';
import { ApplicationSettingsService, CheckoutService, PaymentModelService, PrinterService } from '@dotxix/services';
import { log } from '@dotxix/helpers';

@Component({
  selector: 'acr-complete-order',
  templateUrl: 'complete-order.component.html',
})
export class CompleteOrderComponent implements OnInit {
  constructor(
    protected injector: Injector,
    protected appSettingsService: ApplicationSettingsService,
    protected checkoutService: CheckoutService,
    protected router: Router,
    protected printerService: PrinterService,
    protected paymentModelService: PaymentModelService
  ) {}

  public async ngOnInit() {
    await this.getCompleteOrderResponse();
  }

  public async getCompleteOrderResponse() {
    PosElogHandler.getInstance().posConfig.posHeader.isPreOrder = false;
    log('complete order sent: ', PosElogHandler.getInstance().posConfig);
    const completeOrderResponse = await PosInjectorService.getInstance()
      .sendCompleteOrderToPos(this.appSettingsService.posInjectorPath, PosElogHandler.getInstance().posConfig)
      .catch((e) => null);
    log('complete order response: ', completeOrderResponse);
    await this.navigateFromCompleteOrder(completeOrderResponse);
  }

  protected async navigateFromCompleteOrder(completeOrderResponse) {
    // tslint:disable-next-line: triple-equals
    if (!completeOrderResponse || completeOrderResponse.ReturnCode != 0 || !completeOrderResponse.OrderPOSNumber) {
      this.checkoutService.orderPOSNumber = 0;
      this.checkoutService.receiptContent = '';
      await this.printerService.printReceipt(true);
      if (PosElogHandler.getInstance().posConfig.posHeader?.cvars?.TS_No) {
        this.router.navigate(['ts-unavailable']);
      } else {
        this.router.navigate(['checkout-error']);
      }
      return;
    }
    this.checkoutService.orderPOSNumber = completeOrderResponse.OrderPOSNumber;
    this.checkoutService.receiptContent = completeOrderResponse.Receipt;
    if (this.paymentModelService.getTotalAmountPaidWithCash() <= this.paymentModelService.initialAmountThatCanBePaidWithCash) {
      this.printerService.printReceipt(false);
    } else {
      this.checkoutService.receiptContent = this.printerService.buildErrorsCashMachineReceipt(true);
      await AtpPrinterService.getInstance()
        .print(this.checkoutService.receiptContent)
        .catch((e) => null);
    }
    if (PosElogHandler.getInstance().posConfig.posHeader?.cvars?.TS_No) {
      this.router.navigate(['ts-confirmation']);
    } else {
      this.router.navigate(['order-number']);
    }
  }
}
