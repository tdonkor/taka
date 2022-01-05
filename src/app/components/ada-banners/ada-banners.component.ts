import { Component, OnDestroy, OnInit } from '@angular/core';
import { BannersService } from '@dotxix/services';
import { DotBanner } from 'dotsdk';

@Component({
  selector: 'acr-ada-banners',
  templateUrl: './ada-banners.component.html',
  styleUrls: ['./ada-banners.component.scss'],
})
export class AdaBannersComponent implements OnInit, OnDestroy {
  public accesibilityBanners: DotBanner[] = [];

  constructor(public bannersService: BannersService) {}

  public ngOnInit(): void {
    this.bannersService.setBannerSlideShow(0, true);
  }
  public ngOnDestroy() {
    clearTimeout(this.bannersService.slideshowTimeout);
  }
}
