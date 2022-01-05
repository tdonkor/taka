import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { StatusService } from '@dotxix/services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'acr-payment-logos',
  templateUrl: './payment-logos.component.html',
  styleUrls: ['./payment-logos.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PaymentLogosComponent implements OnInit, OnDestroy {
  public paymentIcons: string[];
  public subscriptions: Subscription[] = [];

  constructor(protected statusService: StatusService) {}

  public ngOnInit() {
    this.subscriptions.push(
      this.statusService.onNewSdkPeripheralCheck.subscribe((status) => {
        this.paymentIcons = this.getPaymentIcons();
      })
    );
    this.paymentIcons = this.getPaymentIcons();
  }
  public ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public getPaymentIcons(): string[] {
    return this.statusService.paymentsAvailableForApp.reduce((acc, payment) => {
      payment.Icon?.forEach((icon) => {
        acc.push('./assets/icons/' + icon);
      });
      return acc;
    }, [] as string[]);
  }
}
