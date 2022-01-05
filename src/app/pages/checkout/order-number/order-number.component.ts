import { CheckoutService, SessionEndType, SessionService, TranslationsService, WindowReloadService } from '@dotxix/services';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { isAdaEnabled, log, routeToFirstPage } from '@dotxix/helpers';

import { Router } from '@angular/router';

@Component({
  selector: 'acr-order-number',
  templateUrl: './order-number.component.html',
})
export class OrderNumberComponent implements OnInit {
  public isAdaEnabled = isAdaEnabled;

  @Output() public orderClosed: EventEmitter<void> = new EventEmitter();

  public get orderNumber(): number {
    return this.checkoutService.orderPOSNumber || 999;
  }
  constructor(
    // protected printerService: PrinterService,
    protected checkoutService: CheckoutService,
    protected router: Router,
    protected sessionService: SessionService,
    private windowReload: WindowReloadService,
    protected translationsService: TranslationsService
  ) {
    this.translationsService.recoverFromSnapShot();
  }

  public async ngOnInit() {
    new Promise<void>((resolve) => {
      setTimeout(async () => {
        log('End Checkout, go to ', routeToFirstPage());
        await this.sessionService.restartSession(SessionEndType.ORDER_SUCCESS);
        resolve();
      }, 5000);
    }).then(() => {
      const isReloading = this.windowReload.isReloading();
      if (!isReloading) {
        this.router.navigate([routeToFirstPage()]);
      }
    });
  }
}
