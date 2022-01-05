import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { createFakeButton, enabledTouchlessMode, isAdaEnabled } from '@dotxix/helpers';
import { ApplicationSettingsService, BasketService, CheckoutService, PaymentModelService } from '@dotxix/services';
import { DotButton, DotButtonType } from 'dotsdk';
import { Subscription } from 'rxjs';
@Component({
  selector: 'acr-cod-view',
  templateUrl: './cod-view.component.html',
})
export class CodViewComponent implements OnInit, DoCheck, OnDestroy, AfterViewChecked, AfterViewInit {
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  public enabledTouchlessMode = enabledTouchlessMode;
  public isAdaEnabled = isAdaEnabled;
  public hasChanged = false;
  public formattedButtons: DotButton[];
  public subscriptions: Subscription[] = [];
  private _scrollIncrement;

  public get totalPrice(): number {
    const basketTotalCents = this.basketService.calculateTotalPrice(this.basketService.buttons);
    if (this.appSettingsService.skipPrecalculate) {
      this.checkoutService.subtotalCents =
        this.hasOrderDiscount && this.orderDiscount <= basketTotalCents ? basketTotalCents - this.orderDiscount : basketTotalCents;
    }
    return this.paymentModelService.getAmountOwed();
  }

  public get orderDiscount(): number {
    const discountAmountButton = this.basketService.buttons.find((button) => button['$$OrderDiscount']);
    return discountAmountButton && Number.isInteger(discountAmountButton['$$OrderDiscount']) ? discountAmountButton['$$OrderDiscount'] : 0;
  }

  public get hasOrderDiscount(): boolean {
    return this.basketService.buttons.some((button) => button['$$OrderDiscount']);
  }

  public get scrollIncrement(): number {
    return this._scrollIncrement;
  }

  constructor(
    protected basketService: BasketService,
    protected checkoutService: CheckoutService,
    protected appSettingsService: ApplicationSettingsService,
    protected paymentModelService: PaymentModelService,
    protected cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    if (this.appSettingsService.skipPrecalculate) {
      this.paymentModelService.setInitialAmountThatCanBePaidWithCash();
    }
    this.formattedButtons = this.getFormattedButtons();
    this.subscriptions.push(
      this.basketService.basketButtonsUpdate.subscribe((x) => {
        this.formattedButtons = this.getFormattedButtons();
      })
    );
  }
  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public ngDoCheck(): void {
    if (this.formattedButtons.length === 0 && !this.hasChanged) {
      this.hasChanged = true;
      window.history.go(-1);
    }
  }

  public ngAfterViewInit() {
    this.verticalScrollIncrement();
  }
  public ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  public getFormattedButtons(): DotButton[] {
    return this.basketService.buttons.reduce((acc, btn, i, arr) => {
      if (!btn['childLinkUUID'] && (!btn.isPromo || arr.filter((b) => b['Promo']?.UUID === btn['Promo'].UUID).length <= 1)) {
        acc.push(btn);
      } else if (btn['childLinkUUID']) {
        return acc;
      } else if (btn.isPromo && !btn['$$OrderDiscount']) {
        const find = acc.find((a) => a['Promo']?.UUID === btn['Promo'].UUID);
        if (find) {
          find['promoChildButtons'].push(btn);
        } else {
          const fakeButton = createFakeButton();
          fakeButton['Promo'] = btn['Promo'];
          fakeButton.Price = '0';
          fakeButton.Caption = btn['Promo'].name;
          fakeButton.isPromo = true;
          fakeButton.quantity = 1;
          fakeButton.ButtonType = DotButtonType.ITEM_BUTTON;
          fakeButton['promoChildButtons'] = [btn];
          acc.push(fakeButton);
        }
      }
      return acc;
    }, []);
  }
  public productRemoved() {
    setTimeout(() => {
      this.scrollRef.nativeElement.click();
    }, 0);
  }
  private verticalScrollIncrement() {
    this._scrollIncrement = this.scrollRef ? this.scrollRef?.nativeElement?.clientHeight / 3 : 0;
  }
}
