import { PosElogHandler, PosInjectorService } from 'dotsdk';
import { ApplicationSettingsService } from './app-settings.service';
import { CheckoutService } from './checkout.service';
import { log } from '../helpers/log.helper';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
  })

export class PosOperationsService {

  constructor(protected appSettingsService: ApplicationSettingsService) {
  }

  public async sendVoidOrderToPOS(): Promise<boolean> {
    log('void order sent: ', PosElogHandler.getInstance().posConfig);
    const voidOrderResponse = await PosInjectorService.getInstance()
      .voidOrderOnPos(this.appSettingsService.posInjectorPath, PosElogHandler.getInstance().posConfig)
      .catch(e => null);
    log('void order response: ', voidOrderResponse);
    // tslint:disable-next-line: triple-equals
    return (voidOrderResponse && voidOrderResponse.ReturnCode == 0);
  }

  public async sendUnlockOrderToPOS() {
    log('unlock order sent: ', PosElogHandler.getInstance().posConfig);
    const unlockOrderResponse = await PosInjectorService.getInstance()
      .unlockOrderOnPos(this.appSettingsService.posInjectorPath, PosElogHandler.getInstance().posConfig)
      .catch(e => null);
    log('unlock order response: ', unlockOrderResponse);
  }
}
