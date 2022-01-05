import { Injectable } from '@angular/core';
import {
  getMainPage,
  getInnerButtons,
} from 'dotsdk';

@Injectable({
  providedIn: 'root',
})
export class ContentService {


  constructor() {}

  /**
   * This function will get called in App Initialize phase, so the content will be ready when the App gets rendered
   *
   * @param acreBridgeAssets path to 'shared\assets' folder (where DOTXIX-DataDeliveryService will copy .json files)
   */
  public async initialize(acreBridgeAssets: string) {

    this.cacheImages(
      getInnerButtons(getMainPage()).map((x) => x.Picture),
      acreBridgeAssets
    );
  }

  protected async cacheImages(images: string[], acreBridgeAssets: string): Promise<void> {
    const imageLoader = (path: string) => {
      return new Promise<boolean>((resolve) => {
        const image = new Image();

        // ? Handle 404 (Not Found)
        if (path === '/assets/shared/assets/Items/null') {
          path = '/assets/branding/taka.PNG';
        }

        image.onload = () => {
          resolve(true);
        };

        image.onerror = () => {
          // Log.debug('Could not load image: {0}', path);
          resolve(false);
        };

        image.src = path;
      });
    };

    const itemsPath = acreBridgeAssets + '/Items/';

    return Promise.runSerial(images.map((_) => () => imageLoader(itemsPath + _))).then((_: boolean[]) => {});
  }
}
