import { AtpPrinterService, PosElogHandler, PosInjectorService } from 'dotsdk';
import { Component, Injector, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import {
  ApplicationSettingsService,
  CheckoutService,
  PaymentModelService,
  PosOperationsService,
  PrinterService,
} from '@dotxix/services';
import { log } from '@dotxix/helpers';

@Component({
  selector: 'acr-tender-order',
  templateUrl: 'tender-order.component.html',
})
export class TenderOrderComponent implements OnInit {
  constructor(
    protected injector: Injector,
    protected appSettingsService: ApplicationSettingsService,
    protected checkoutService: CheckoutService,
    protected router: Router,
    protected printerService: PrinterService,
    protected posOperationService: PosOperationsService,
    protected paymentModelService: PaymentModelService
  ) {}

  public async ngOnInit() {
    await this.getTenderOrderResponse();
  }

  public async getTenderOrderResponse() {
    PosElogHandler.getInstance().posConfig.posHeader.isPreOrder = false;
    log('tender order sent: ', PosElogHandler.getInstance().posConfig);
    const tenderOrderResponse = await PosInjectorService.getInstance()
      .tenderOrderOnPos(this.appSettingsService.posInjectorPath, PosElogHandler.getInstance().posConfig)
      .catch((e) => null);
    log('tender order response: ', tenderOrderResponse);
    this.navigateFromTenderOrder(tenderOrderResponse);
  }

  protected async navigateFromTenderOrder(tenderOrderResponse) {
    // tslint:disable-next-line: triple-equals
    if (!tenderOrderResponse || tenderOrderResponse.ReturnCode != 0 || !tenderOrderResponse.OrderPOSNumber) {
      this.checkoutService.receiptContent = '';
      if (PosElogHandler.getInstance().posConfig.posHeader?.cvars?.TS_No) {
        if (this.appSettingsService.unlockOrder) {
          await this.posOperationService.sendUnlockOrderToPOS();
        }
        this.router.navigate(['ts-unavailable']);
      } else {
        this.router.navigate(['checkout-error', { posOperation: 'unlock-order' }]);
      }
      await this.printerService.printReceipt(true);
      return;
    }
    this.checkoutService.orderPOSNumber = tenderOrderResponse.OrderPOSNumber;
    this.checkoutService.receiptContent = tenderOrderResponse.Receipt;
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
