import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DotSessionService } from 'dotsdk';
import { isAdaEnabled, OrderCheckInFlowBundleSetting } from './helpers';
import { AppInitService, ApplicationSettingsService } from './services';
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  public touchlessClass = 'touchlessEnabled';
  public isAdaEnabled = isAdaEnabled;

  public get appInitService(): AppInitService {
    return this.injector.get(AppInitService);
  }

  constructor(private appSettings: ApplicationSettingsService, private router: Router, private injector: Injector) {}

  public async ngOnInit() {
    DotSessionService.initializationFinished();
    await this.appInitService.initialize();
    if (this.appSettings.touchlessMode) {
      document.documentElement.classList.add(this.touchlessClass);
    }
    if (this.appSettings.orderCheckInFlow === OrderCheckInFlowBundleSetting.ONLY_SERVICE_TYPE) {
      this.router.navigate(['service-type']);
    } else {
      this.router.navigate(['banners']);
    }
  }
}
