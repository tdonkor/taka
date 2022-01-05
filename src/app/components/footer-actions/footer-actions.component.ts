import * as _ from 'lodash';

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DotSuggestionSalesService, PosServingLocation, SectionAvailability, cancelOrderEvent, getMainPage } from 'dotsdk';
import { Suggestion, TableServiceType } from '@dotxix/models';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ApplicationSettingsService,
  BasketService,
  CheckoutService,
  ContentService,
  DynamicContentService,
  EndSceneRoutingService,
  SessionEndType,
  SessionService,
  StatusService,
  WorkingHoursService,
} from '@dotxix/services';
import { DotCdkTranslatePipe } from '@dotxix/pipes';
import { isAdaEnabled, log, routeToFirstPage, toggleAdaMode } from '@dotxix/helpers';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SuggestionSalesComponent } from '../suggestion-sales/suggestion-sales.component';

@Component({
  selector: 'acr-footer-actions',
  templateUrl: './footer-actions.component.html',
})
export class FooterActionsComponent implements OnInit, OnDestroy {
  @Input() public leftBtnMethod: string;
  @Input() public leftBtnAriaLabel: string;
  @Input() public leftBtnTranslate: string;
  @Input() public rightBtnMethod: string;
  @Input() public rightBtnAriaLabel: string;
  @Input() public rightBtnTranslate: string;
  public subscriptions: Subscription[] = [];

  public isAdaEnabled = isAdaEnabled;

  constructor(
    protected dynamicContentService: DynamicContentService,
    protected translatePipe: DotCdkTranslatePipe,
    protected sessionService: SessionService,
    protected basketService: BasketService,
    protected contentService: ContentService,
    protected router: Router,
    protected checkoutService: CheckoutService,
    protected appSettingsService: ApplicationSettingsService,
    protected statusService: StatusService,
    protected endSceneRoutingService: EndSceneRoutingService,
    public workingHoursService: WorkingHoursService
  ) {}

  public ngOnInit(): void {}
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public async leftButton(event: MouseEvent) {
    if (this.leftBtnMethod === 'startOver') {
      this.startOver(event);
    } else {
      await this.goBack();
    }
  }

  public rightButton(ev: MouseEvent): void {
    if (this.rightBtnMethod === 'goToCheckout') {
      this.goToCheckout();
    } else {
      this.payOrder(ev);
    }
  }

  public get basketButtonsLength(): number {
    return this.basketService.getQuantityButtons();
  }
  public get orderDiscount(): number {
    return this.basketService.buttons.some((button) => button['$$OrderDiscount'] >= 0) ? 1 : 0;
  }

  public get leftButtonIcon(): string {
    if (this.leftBtnAriaLabel === 'Cancel Order Button') {
      return '#lib-icon--cross';
    }
    return '#lib-icon--chevron-left';
  }

  public async switchAdaMode() {
    await toggleAdaMode();
  }

  private startOver(event: MouseEvent): void {
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: this.translatePipe.transform('38'),
      leftButtonText: this.translatePipe.transform('32'),
      rightButtonText: this.translatePipe.transform('33'),
    });

    this.subscriptions.push(
      contentRef.afterClosed.subscribe(async (response) => {
        if (response === 'Yes') {
          await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
          cancelOrderEvent.emit(event);
          this.dynamicContentService.closeAllDialogs();
          this.router.navigate([routeToFirstPage()]);
          return;
        }
      })
    );
  }

  private async goBack() {
    this.checkoutService.basketButtons = _.cloneDeep(this.basketService.buttons);
    this.checkoutService.resetOrderTotal();
    // const backSteps = this.checkoutService.previousUrls.length * -1;
    // window.history.go(backSteps);
    // this.checkoutService.previousUrls = [];
    this.router.navigate(['menu', getMainPage()?.ID]);
  }

  private async goToCheckout() {
    this.dynamicContentService.closeAllDialogs();
    const suggestions = DotSuggestionSalesService.getInstance().getOrderSuggestions();
    if (suggestions && suggestions.length > 0) {
      const contentRef = this.dynamicContentService.openContent(SuggestionSalesComponent, { suggestion: new Suggestion(suggestions) });
      const contentRefSubscription = contentRef.afterClosed.subscribe(async () => {
        await this.checkoutService.startCheckoutTunnel();
        contentRefSubscription.unsubscribe();
      });
    } else {
      await this.checkoutService.startCheckoutTunnel();
    }
  }

  private async payOrder(ev: MouseEvent) {
    let whTSSEnabled = true;
    const response = this.workingHoursService.getSectionResponse(SectionAvailability.TABLE_SERVICE);
    if (response && 'TSSEnabled' in response && response.TSSEnabled !== undefined) {
      whTSSEnabled = response.TSSEnabled;
    }
    if (this.statusService.paymentsAvailableForApp.length < 1) {
      log('no payment method found, go to ', routeToFirstPage());
      await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
      cancelOrderEvent.emit(ev);
      this.router.navigate([routeToFirstPage()]);
      return;
    }
    if (
      this.appSettingsService.tableServiceMode === TableServiceType.BOTH ||
      (this.appSettingsService.tableServiceMode === TableServiceType.EAT_IN && this.sessionService.serviceType === PosServingLocation.IN) ||
      (this.appSettingsService.tableServiceMode === TableServiceType.TAKE_OUT && this.sessionService.serviceType === PosServingLocation.OUT)
    ) {
      if (whTSSEnabled) {
        this.router.navigate(['ts-entry']);
        return;
      }
      // this.router.navigate(['ts-selection']);
      // return;
    }
    this.endSceneRoutingService.goToEndScene();
  }
}
