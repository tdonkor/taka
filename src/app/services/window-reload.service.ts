import { Injectable } from '@angular/core';
import { ApplicationSettingsService } from './app-settings.service';

const enum reloadStatus {
  reloadDisabled,
}

@Injectable({
  providedIn: 'root',
})
export class WindowReloadService {
  private reloadAfterNumberOfOrders: number;
  private currentOrders = 0;
  constructor(
    protected appSettings: ApplicationSettingsService,
    private window: Window
  ) {
    this.reloadAfterNumberOfOrders =
      this.appSettings.reloadAfterCompletedOrders;
  }

  public isReloading(): boolean {
    if (this.reloadAfterNumberOfOrders === reloadStatus.reloadDisabled) {
      return false;
    }
    this.increment();
    if (this.shouldReload()) {
      this.window.location.href = this.window.location.origin;
      return true;
    }
    return false;
  }

  private increment() {
    ++this.currentOrders;
  }

  private shouldReload(): boolean {
    return this.currentOrders === this.reloadAfterNumberOfOrders;
  }
}

