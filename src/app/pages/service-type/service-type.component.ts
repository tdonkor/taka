import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { getMainPage, MaintenanceService, PeripheralCheckProducerMessage, PosServingLocation, SectionAvailability } from 'dotsdk';
import { Subscription } from 'rxjs';
import { isAdaEnabled, OrderCheckInFlowBundleSetting, toggleAdaMode } from '@dotxix/helpers';
import {
  AppInitService,
  ApplicationSettingsService,
  ContentService,
  SessionService,
  StatusService,
  TranslationsService,
  WorkingHoursService,
} from '@dotxix/services';
import { DotCdkTranslatePipe } from '@dotxix/pipes';

@Component({
  selector: 'acr-service-type',
  templateUrl: './service-type.component.html',
})
export class ServiceTypeComponent implements OnInit, OnDestroy {
  public PosServingLocation = PosServingLocation;
  public subscriptions: Subscription[] = [];
  public errorMessages: string[] = [];
  public blockKiosk = false;
  public isAdaEnabled = isAdaEnabled;
  public whEatInEnabled = true;
  public whTakeAwayEnabled = true;

  public get isServiceTypeFirstScreen(): boolean {
    return this.appSettings.orderCheckInFlow === OrderCheckInFlowBundleSetting.ONLY_SERVICE_TYPE;
  }

  constructor(
    public appSettings: ApplicationSettingsService,
    protected translateService: TranslationsService,
    protected sessionService: SessionService,
    protected router: Router,
    protected contentService: ContentService,
    protected statusService: StatusService,
    protected translatePipe: DotCdkTranslatePipe,
    public workingHoursService: WorkingHoursService,
    protected appInitService: AppInitService,
    @Inject(DOCUMENT) private _document: any
  ) {}

  public ngOnInit() {
    if (this.isServiceTypeFirstScreen) {
      MaintenanceService.getInstance().addAdminGestureZone({
        cssWidth: '10vw',
        cssHeight: '10vw',
        tapCount: 4,
        tapInterval: 400
      });
      this.subscriptions.push(
        this.statusService.onNewSdkPeripheralCheck.subscribe((value: PeripheralCheckProducerMessage) => {
          this.blockKiosk = value.block;
        })
      );
    }
    const response = this.workingHoursService.getSectionResponse(SectionAvailability.SERVICE_TYPE);

    if (response && 'EatInEnabled' in response && response.EatInEnabled !== undefined) {
      this.whEatInEnabled = response.EatInEnabled;
      this.whTakeAwayEnabled = response.TakeAwayEnabled;
    }
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.isServiceTypeFirstScreen) {
      MaintenanceService.getInstance().removeAdminGestureZone();
    }
  }
  public setServiceType(type: PosServingLocation) {
    if (this.blockKiosk) {
      return;
    }
    this.sessionService.setServiceType(type);
    this.appInitService.setMetaTags();
    this.router.navigate(['menu', getMainPage()?.ID]);
  }

  public async switchAdaMode() {
    await toggleAdaMode();
  }

  public isLanguageButtonActive(languageCode: string) {
    return this.translateService.currentLanguage && this.translateService.currentLanguage.code === languageCode;
  }

  public onLanguageButtonClick(languageCode: string) {
    this.translateService.setCurrentLanguage(languageCode);
    this._document.documentElement.lang = languageCode;
  }
}
