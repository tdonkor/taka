import { AtpApplicationSettings } from 'dotsdk';

export enum OrderCheckInFlowBundleSetting {
  ONLY_SERVICE_TYPE = 'ONLY_SERVICE_TYPE',
  ONLY_BANNERS = 'ONLY_BANNERS',
  BOTH = '*',
}

export function routeToFirstPage(): string {
  return (AtpApplicationSettings.getInstance().bundleSettingsJson.orderCheckInFlow === OrderCheckInFlowBundleSetting.ONLY_SERVICE_TYPE) ?
    'service-type' :
    'banners';
}
