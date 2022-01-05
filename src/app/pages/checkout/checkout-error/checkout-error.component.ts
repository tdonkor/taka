import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { AtpPrinterService } from 'dotsdk';
import { CheckoutType } from '@dotxix/models';
import { Subscription } from 'rxjs';
import { isAdaEnabled, log, routeToFirstPage } from '@dotxix/helpers';
import { DotCdkTranslatePipe } from '@dotxix/pipes';
import {
  ApplicationSettingsService,
  CheckoutService,
  PosOperationsService,
  PrinterService,
  PrintReceiptBuilder,
  SessionEndType,
  SessionService,
  TranslationsService,
} from '@dotxix/services';

@Component({
  selector: 'acr-checkout-error',
  templateUrl: 'checkout-error.component.html',
})
export class CheckoutErrorComponent implements OnInit, OnDestroy {
  public posOperation: string;
  public displayPaymentImage: boolean;
  public isAdaEnabled = isAdaEnabled;
  public subscriptions: Subscription[] = [];

  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected translatePipe: DotCdkTranslatePipe,
    protected posOperationService: PosOperationsService,
    protected sessionService: SessionService,
    protected checkoutService: CheckoutService,
    protected appSettingsService: ApplicationSettingsService,
    protected printerService: PrinterService,
    protected printReceiptBuilder: PrintReceiptBuilder,
    protected translateService: TranslationsService
  ) {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const showPicture = params.get('displayPaymentImage');
        this.displayPaymentImage = showPicture ? showPicture === 'true' : false;
        this.posOperation = params.get('posOperation');
      })
    );
  }

  public async ngOnInit() {
    // sbo: take into consideration the pos operation received from navigation
    if (this.appSettingsService.posInjectionFlow === CheckoutType.PAY_AFTER_POS) {
      if (this.posOperation === 'void-order' && this.checkoutService.openedOrder) {
        // await this.posOperationService.sendVoidOrderToPOS();
        this.checkoutService.openedOrder = !(await this.posOperationService.sendVoidOrderToPOS());
      } else if (this.posOperation === 'unlock-order' && this.appSettingsService.unlockOrder) {
        await this.posOperationService.sendUnlockOrderToPOS();
      }
    }

    setTimeout(async () => {
      if (this.posOperation === 'unlock-order') {
        await this.printTicket();
        return;
      }
      log('End Checkout, go to ', routeToFirstPage());
      await this.sessionService.restartSession(SessionEndType.ORDER_FAIL);
      this.router.navigate([routeToFirstPage()]);
    }, 5000);
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  private async printTicket() {
    const oldLanguage = this.translateService.currentLanguage.code;
    this.translateService.setCurrentLanguage(this.appSettingsService.defaultLanguage);
    this.checkoutService.receiptPayAtCounter = this.translatePipe.transform('2021020801');
    this.translateService.setCurrentLanguage(oldLanguage);
    const receipt = this.printerService.buildReceipt(
      this.checkoutService.orderPOSNumber.toString(),
      (this.checkoutService.orderTotal / 100).toFixed(2),
      false
    );
    await AtpPrinterService.getInstance()
      .print(receipt)
      .catch((e) => null);
    this.printReceiptBuilder.clearContent();
    this.router.navigate(['order-number']);
  }
}
