import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { timeoutOrderEvent, cancelOrderEvent, MessageController, CoreProducerTypes, InactivityWatchProducerStates, MessageBroker, InactivityProducerMessage, InactivityNotificationType } from 'dotsdk';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { OrderCheckInFlowBundleSetting } from '../helpers/first-page.helper';
import { DotCdkTranslatePipe } from '../pipes/dot-translate.pipe';
import { ApplicationSettingsService } from './app-settings.service';
import { DynamicContentService } from './dynamic-content/dynamic-content.service';
import { SessionEndType, SessionService } from './session.service';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {

  // define a list of route segments on which the app will ignore inactivity
  protected inactivityExceptionScreens = [
    'banners',
    'service-type',
    'payment-selection',
    'payment-progress',
    'complete-order',
    'checkout-error',
    'calculate-totals',
    'order-number',
    'preorder',
    'open-order',
    'glory-payment-progress',
    'glory-cash-info',
  ];
  protected isInactivityWarningComponentVisible: boolean;
  protected _cssClass = 'ada';

  constructor(
    @Inject(DOCUMENT) private _document: any,
    private dynamicContentService: DynamicContentService,
    private translatePipe: DotCdkTranslatePipe,
    private sessionService: SessionService,
    protected router: Router,
    protected appSettings: ApplicationSettingsService
  ) {}

  public init() {
    this.handleInactivityProducerStateByRoute();
    this.handleInactivityMessages();
  }

  protected handleInactivityProducerStateByRoute() {
    // filter the routes and set the state of the Inactivity Message Producer to:
    //   - InactivityWatchProducerStates.WATCH on routes that are not included in this.inactivityExceptionScreens
    //   - InactivityWatchProducerStates.IGNORE on routes that are included in this.inactivityExceptionScreens
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map((navigationEndEvent: NavigationEnd) => navigationEndEvent.urlAfterRedirects.replace(/^\//, '').split('/'))
      ).subscribe((urlSegments: string[]) => {
        const segmentsIntersection = this.inactivityExceptionScreens.filter(forbiddenUrlSegment => urlSegments.includes(forbiddenUrlSegment));
        if (!segmentsIntersection.length) {
          MessageController.getInstance().changeMessageProducerState(CoreProducerTypes.INACTIVITY, InactivityWatchProducerStates.WATCH);
        } else {
          MessageController.getInstance().changeMessageProducerState(CoreProducerTypes.INACTIVITY, InactivityWatchProducerStates.IGNORE);
        }
    });
  }

  protected handleInactivityMessages() {
    // listen to Inactivity Producer messages and, according to message type, show a warning popup or reset session
    MessageBroker.getInstance().subscribe(CoreProducerTypes.INACTIVITY, async (message: InactivityProducerMessage) => {

      switch (message.inactivityNotificationType) {
        case InactivityNotificationType.WARN:
          if (!this.isInactivityWarningComponentVisible) {
            this.showInactivityWarning();
          }
          break;
        case InactivityNotificationType.CLOSE:
          this.goHome();
          break;
      }
    });
  }

  protected get isAccessibilityMode() {
    return this._document.body.classList.contains(this._cssClass);
  }

  protected async goHome() {
    this.isInactivityWarningComponentVisible = false;
    await this.sessionService.restartSession(SessionEndType.APP_TIMEOUT);
    timeoutOrderEvent.emit(null);
    this.dynamicContentService.closeAllDialogs();
    if (this.appSettings.orderCheckInFlow === OrderCheckInFlowBundleSetting.ONLY_SERVICE_TYPE) {
      this.router.navigate(['service-type']);
    } else {
      this.router.navigate(['banners']);
    }
    if (this.isAccessibilityMode) {
      this._document.body.classList.remove(this._cssClass);
    }
    this.dynamicContentService.closeAllDialogs();
  }

  protected showInactivityWarning() {
    this.isInactivityWarningComponentVisible = true;
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: this.translatePipe.transform('2021020901'),
      rightButtonText: this.translatePipe.transform('2021020902'),
      leftButtonText: this.translatePipe.transform('5'),
      logo: '../../../assets/images/logo.svg',
      // title: 'Are you there?',
      // rightButtonText: 'Continue Order',
      // leftButtonText: 'Cancel Order'
    });

    contentRef.afterClosed.subscribe(async (response) => {
      this.isInactivityWarningComponentVisible = false;
      if (response === 'No') {
        await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
        cancelOrderEvent.emit(null);
        this.dynamicContentService.closeAllDialogs();
        if (this.appSettings.orderCheckInFlow === OrderCheckInFlowBundleSetting.ONLY_SERVICE_TYPE) {
          this.router.navigate(['service-type']);
        } else {
          this.router.navigate(['banners']);
        }
      } else if (response === 'Yes') {
        // Will continue ordering. The Inactivity Message Producer will take care of the rest.
      }
    });
  }
}
