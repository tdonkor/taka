import { Component, OnDestroy, OnInit } from '@angular/core';
import { Animations } from '@dotxix/animation';
import { AbstractDynamicComponent, DynamicContentParams, DynamicContentRef } from '@dotxix/services';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'acr-payment-retry',
  templateUrl: './payment-retry.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
})
export class PaymentRetryComponent extends AbstractDynamicComponent implements OnInit, OnDestroy {
  public exitAnimation = false;
  private _counter: number;
  private timerSubscriber: Subscription;

  constructor(private data: DynamicContentParams, private dynamicContentRef: DynamicContentRef) {
    super();
    this._counter = this.data.counter;
  }

  public ngOnInit(): void {
    this.countdown();
  }

  public ngOnDestroy(): void {
    this.timerSubscriber.unsubscribe();
  }

  public get title(): string {
    return this.data.title;
  }

  public get message(): string {
    return this.data.message;
  }

  public get counter(): string {
    return this._counter.toString();
  }

  public get leftButtonText(): string {
    return this.data.leftButtonText;
  }

  public get rightButtonText(): string {
    return this.data.rightButtonText;
  }

  public onControlsButtonsClick(buttonType: string): void {
    this.exitAnimation = true;
    setTimeout(() => this.dynamicContentRef.close(buttonType), 500);
  }

  private countdown() {
    this.timerSubscriber = timer(1000, 1000).subscribe((val) => {
      if (this._counter >= 2) {
        this._counter--;
      } else {
        this.dynamicContentRef.close();
      }
    });
  }
}
