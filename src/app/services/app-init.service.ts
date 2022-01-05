import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { AtpEnvironmentService, IAppDetails, FilesLoaderService, PosRefintService, SDK_VERSION } from 'dotsdk';
import { ApplicationSettingsService } from './app-settings.service';
import { CheckoutService } from './checkout.service';
import { ContentService } from './content.service';
import { InactivityService } from './inactivity.service';
import { SessionEndType, SessionService } from './session.service';
import { TranslationsService } from './translations/translations.service';
import { environment } from '../../environments/environment';
import { CombosCatalog } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AppInitService {

  protected _isBSUpdatePending = false;
  protected _isAssetsUpdatePending = false;
  constructor(
    @Inject(DOCUMENT) private _document: any,
    private meta: Meta,
    protected contentService: ContentService,
    protected appSettings: ApplicationSettingsService,
    protected translationsService: TranslationsService,
    protected inactivityService: InactivityService,
    protected checkoutService: CheckoutService,
    protected sessionService: SessionService
  ) {
    this.sessionService.onRestartSession.subscribe(async (status: SessionEndType) => {
      console.clear();
      if (this._isBSUpdatePending) {
        this.updateAppSettingsService();
      }
      if (this._isAssetsUpdatePending) {
        await this.updateContentService();
      }
      this.setMetaTags();
    });
  }
  public async initialize() {
    if (environment.production) {
      AtpEnvironmentService.getInstance().hideCloseButton().catch((x) => null);
    }
    await this.openDeveloperToolsOnStartUp();
    await this.contentService.initialize(this.appSettings.bridgeAssetsPath);
    this.translationsService.initialize(this.appSettings.languages);
    this._document.documentElement.lang = this.appSettings.defaultLanguage;
    this.inactivityService.init();
    await this.loadComboCatalogFile();
    AtpEnvironmentService.getInstance()
      .onBundleSettingsChanged()
      .subscribe((x) => this.updateAppSettingsService());

    FilesLoaderService.getInstance()
      .listenForUpdates()
      .subscribe(async (response) => this.updateContentService());

    this.setMetaTags();
  }
  public async setMetaTags() {
    const appDetails = await AtpEnvironmentService.getInstance()
      .getAppDetails()
      .catch((e) => null);
    const refint = PosRefintService.getInstance()._refInt;
    this.meta.addTags([
      { name: 'app-version', content: appDetails?.AppVersion },
      { name: 'sdk-version', content: SDK_VERSION },
    ]);
    if (refint) {
      this.meta.updateTag({ name: 'refint', content: refint.toString() });
    }
  }

  protected async openDeveloperToolsOnStartUp() {
    if (AtpEnvironmentService.getInstance().mBirdIsConnected) {
      const appDetails: IAppDetails = await AtpEnvironmentService.getInstance()
        .getAppDetails()
        .catch((e) => null);
      const isBetaApp = appDetails ? appDetails.IsBeta : true;
      if (isBetaApp  && !environment.production) {
        AtpEnvironmentService.getInstance()
          .openDeveloperTools()
          .catch((e) => null);
      }
    }
  }

  // TODO: Investigate if this is needed (combos catalog should already be loaded by sdk)
  protected async loadComboCatalogFile() {
    FilesLoaderService.getInstance().registerLoadersFor(this.appSettings.bridgeAssetsPath, [
      { modelType: CombosCatalog, filename: 'combosCatalog.json' },
    ]);
  }


  protected updateAppSettingsService() {
    if (this.sessionService.isOrderInProgress) {
      this._isBSUpdatePending = true;
      return;
    }
    this.appSettings.mapSettings();
    this._isBSUpdatePending = false;
  }
  protected async updateContentService() {
    if (this.sessionService.isOrderInProgress) {
      this._isAssetsUpdatePending = true;
      return;
    }
    await this.contentService.initialize(this.appSettings.bridgeAssetsPath);
    this._isAssetsUpdatePending = false;
  }
}
