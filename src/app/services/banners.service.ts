import { Injectable } from '@angular/core';
import { DotAvailabilityService, DotBanner, DotBannerSkinType, getBanners } from 'dotsdk';
import { ApplicationSettingsService } from './app-settings.service';
@Injectable({
    providedIn: 'root'
})
export class BannersService {

    public currentBanner: DotBanner;
    public showBanner = true;
    public slideshowTimeout: NodeJS.Timeout;

    public get currentBannerSrc(): string {
      return `${this.appSettings.bridgeAssetsPath}/Banners/${this.currentBanner?.Image}`;
    }
    public get isCurrentBannerImage(): boolean {
      return /.png/.test(this.currentBanner?.Image) || /.jpg/.test(this.currentBanner?.Image);
    }
    public get isCurrentBannerVideo(): boolean {
      return /.webm/.test(this.currentBanner?.Image) || /.mp4/.test(this.currentBanner?.Image);
    }

    constructor(private appSettings: ApplicationSettingsService) {}

    public setBannerSlideShow(index: number, useAccesibilityBanners = false) {
      const bannersLength = this.getBanners(useAccesibilityBanners).length ;
      if (index >= bannersLength) {
        index = 0;
      }
      this.currentBanner = this.getBanners(useAccesibilityBanners)[index];
      this.showBanner = false;
      setTimeout(() => {
        this.showBanner = true;
      }, 0);
      const interval = this.currentBanner?.Interval || 3000;
      if (bannersLength > 1) {
        return this.slideshowTimeout = setTimeout(() => this.setBannerSlideShow(++index, useAccesibilityBanners), interval);
      }
    }

    public getBanners(useAccesibilityBanners: boolean): DotBanner[] {
      const banners = getBanners();
      if (useAccesibilityBanners) {
        return banners.filter(b => (b.Skin as string === 'Accessibility' || b.Skin as string === 'Accesibility') &&
                                                                      DotAvailabilityService.getInstance().isBannerAvailable(b));
      }
      return banners.filter(b => b.Skin === DotBannerSkinType.FULL_HD &&
                                          DotAvailabilityService.getInstance().isBannerAvailable(b));
    }
  }
