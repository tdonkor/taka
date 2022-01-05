import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { getMainPage, MaintenanceService, PeripheralCheckProducerMessage, PosServingLocation } from 'dotsdk';

import { Router } from '@angular/router';
import { OrderCheckInFlowBundleSetting } from '@dotxix/helpers';
import { ApplicationSettingsService, BannersService, ContentService, SessionService, StatusService } from '@dotxix/services';
import { DotCdkTranslatePipe } from '@dotxix/pipes';

@Component({
  selector: 'acr-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BannersComponent implements OnInit, OnDestroy {
  public subscriptions: Subscription[] = [];
  public errorMessages: string[] = [];
  public blockKiosk = false;

  public get isTouchToOrderButtonVisible(): boolean {
    return this.appSettings.enableTouchToOrderSection && !this.blockKiosk;
  }
  public get biServiceTypeAttribute(): PosServingLocation | null {
    if (this.appSettings?.orderCheckInFlow !== OrderCheckInFlowBundleSetting.ONLY_BANNERS) {
      return null;
    }
    if (this.appSettings.serviceType === PosServingLocation.OUT) {
      return PosServingLocation.OUT;
    } else {
      return PosServingLocation.IN;
    }
  }

  constructor(
    public appSettings: ApplicationSettingsService,
    public bannersService: BannersService,
    protected sessionService: SessionService,
    protected contentService: ContentService,
    protected router: Router,
    protected statusService: StatusService,
    protected translatePipe: DotCdkTranslatePipe
  ) {}

  public ngOnInit() {
    MaintenanceService.getInstance().addAdminGestureZone({
      cssWidth: '10vw',
      cssHeight: '10vw',
      tapCount: 4,
      tapInterval: 400
    });
    this.bannersService.setBannerSlideShow(0);
    this.subscriptions.push(
      this.statusService.onNewSdkPeripheralCheck.subscribe((value: PeripheralCheckProducerMessage) => {
        this.blockKiosk = this.statusService.isKioskBlockedDueToPeripherals(value);
      })
    );
  }

  public ngOnDestroy() {
    MaintenanceService.getInstance().removeAdminGestureZone();
    clearTimeout(this.bannersService.slideshowTimeout);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  @HostListener('click')
  public navigate() {
    if (this.blockKiosk) {
      return;
    }
    if (this.appSettings.orderCheckInFlow === OrderCheckInFlowBundleSetting.ONLY_BANNERS) {
      // this.sessionService.setServiceType(PosServingLocation.IN);
      this.router.navigate(['menu', getMainPage()?.ID]);
    } else {
      this.router.navigate(['service-type']);
    }
  }
}
