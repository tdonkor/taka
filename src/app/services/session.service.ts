import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { sessionEndEvent, PosServingLocation, DotSessionService, PosElogHandler, PosPaidState, OMSEventsFacade } from 'dotsdk';
import { Observable, Subject } from 'rxjs';
import { disableAdaMode } from '../helpers/ada.helper';
import { AllergensService } from './allergens.service';
import { ApplicationSettingsService } from './app-settings.service';
import { BasketService } from './basket.service';
import { PromosService } from './promos.service';
import { TranslationsService } from './translations/translations.service';


export enum SessionEndType {
  CANCEL_ORDER = 'CANCEL_ORDER',
  APP_TIMEOUT = 'APP_TIMEOUT',
  ORDER_SUCCESS = 'ORDER_SUCCESS',
  ORDER_FAIL = 'ORDER_FAIL',
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  protected _onRestartSession: Subject<SessionEndType> = new Subject();
  protected _orderStarted: Date;
  protected _isOrderInProgress = false;

  public get onRestartSession(): Observable<SessionEndType> {
    return this._onRestartSession.asObservable();
  }

  public get serviceType(): PosServingLocation {
    return DotSessionService.getInstance().currentPosServingLocation;
  }

  public get orderStarted(): Date {
    return this._orderStarted;
  }

  public get isOrderInProgress(): boolean {
    return this._isOrderInProgress;
  }

  constructor(protected translationService: TranslationsService,
              protected appSettings: ApplicationSettingsService,
              protected allergensService: AllergensService,
              protected basketService: BasketService,
              protected promosService: PromosService,
              @Inject(DOCUMENT) private _document: any) {}

  public async restartSession(type: SessionEndType) {
    
    if (this.appSettings.enableOMSModule) {
      await this.sendOMSUpdates(type);
    }
    this._onRestartSession.next(type);
    DotSessionService.endSession();
    this.basketService.resetBasket();
    this._orderStarted = null;
    this._isOrderInProgress = false;
    this.translationService.setCurrentLanguage(this.appSettings.defaultLanguage);
    this.allergensService.resetAllergens();
    const adaClass = this.appSettings.enabledTouchlessDM ? 'ada--touchless' : 'ada';
    if (this._document.documentElement.classList.contains(adaClass)) {
      disableAdaMode(adaClass);
    }
    this.promosService.resetPromos();
  }

  public setServiceType(type: PosServingLocation) {
    DotSessionService.startSession(type);
    if (!this._orderStarted) {
      this._orderStarted = new Date();
      this._isOrderInProgress = true;
    }
  }

  protected sendOMSUpdates(status: SessionEndType) {
    return new Promise<void>((resolve, reject) => {
      if (!this.appSettings.enableOMSModule) {
        resolve();
        return;
      }
      const orderTotal = PosElogHandler.getInstance().posConfig.posHeader?.amounts?.amountsTotalPaid;
      const amount = orderTotal && orderTotal > 0 ? orderTotal : this.basketService.totalPrice;
      const isPaid = PosElogHandler.getInstance().posConfig.posHeader?.amounts?.tenders?.reduce((acc, t) => {
        if (t.paid === PosPaidState.PAID) {
          return acc + t.paidAmount;
        }
        return acc;
      }, 0) >= orderTotal;
      if (status !== SessionEndType.ORDER_SUCCESS) {
          new OMSEventsFacade().recallEvent(amount, false).subscribe(() => {
            new OMSEventsFacade().cancelEvent(amount, isPaid).subscribe(() => resolve());
          });
      } else {
        new OMSEventsFacade().finishEvent(amount, isPaid).subscribe(() => resolve());
      }
    });
  }
}
