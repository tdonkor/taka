import { AtpApplicationSettings, PeripheralCheckMode, PosServingLocation } from 'dotsdk';

import { Inject, Injectable } from '@angular/core';

import {
  CalculateTotalMode,
  CheckoutType,
  HomeButtonDisplayType,
  Language,
  NutritionalInformationDisplayType,
  PaymentFailType,
  PaymentType,
  PromoDiscountsMode,
  PromoInputOption,
  RoundingStrategies,
  TableServiceType,
} from '@dotxix/models';
import { OrderCheckInFlowBundleSetting } from '@dotxix/helpers';

@Injectable({
  providedIn: 'root',
})
export class ApplicationSettingsService {
  public sharedFolderPath: string;
  public bridgeAssetsPath: string;
  // The function number 33 call is skipped on POS if true
  public skipPrecalculate = false;
  public posInjectionFlow: CheckoutType = CheckoutType.PAY_AFTER_POS;
  public maxPaymentRetries = 2;
  public paymentFailRedirect: PaymentFailType = PaymentFailType.PAY_RETRY;
  public languages: Language[] = [];
  public defaultLanguage: string;
  public currencySymbol = '$';
  public currencySymbolBefore = true;
  public decimalSeparator = '.';
  public posInjectorPath: string;
  public posInjectorPathTest: string;
  public reverseBasketOrder = false;
  public orderCheckInFlow: OrderCheckInFlowBundleSetting = OrderCheckInFlowBundleSetting.BOTH;
  public serviceType: PosServingLocation = PosServingLocation.ALL;
  public enableTouchToOrderSection = true;
  public peripheralsCheckTimer = 30000;
  public paymentCheckMode: PeripheralCheckMode = PeripheralCheckMode.DoNotTest;
  public printerCheckMode: PeripheralCheckMode = PeripheralCheckMode.DoNotTest;
  public scannerCheckMode: PeripheralCheckMode = PeripheralCheckMode.DoNotTest;
  public POSCheckMode: PeripheralCheckMode = PeripheralCheckMode.DoNotTest;
  public kioskId: number;
  public paymentTypes: PaymentType[];
  public productRemovalWarning = false;
  public quantityCalculated = false;
  public homeButtonDisplay: HomeButtonDisplayType = HomeButtonDisplayType.DISPLAY_DOCKED;
  public calculateTotalMode: CalculateTotalMode = CalculateTotalMode.DO_NOT_VOID_ON_RETURN;
  public skipSinglePaymentSelection = true;
  public viewBasketAfterProductSelection = false;
  public nutritionalInformationDisplayType: NutritionalInformationDisplayType = NutritionalInformationDisplayType.DO_NOT_DISPLAY;
  public enableComboAnimation = false;
  public tableServiceMode: TableServiceType = TableServiceType.DISABLED;
  public inactivityWarningTimer = 300000;
  public inactivityCloseTimer = 300000;
  public printStoreDetails = true;
  public storeName: string;
  public storeCode: string;
  public storeAddress1: string;
  public storeAddress2: string;
  public storeTelephone: string;
  public printPOSReceipt = true;
  public paymentRetryCounter = 10;
  public receiptEFTPartialCut = false;
  public promoInputOption: PromoInputOption = PromoInputOption.BOTH;
  public gloryPayableAmount = '10000';
  public enabledTouchlessDM = false;
  public enableOMSModule = false;
  public enableOMSRecall = false;
  // tableServiceItem represent a Button Link from catalog.json.
  // When injecting an order to the POS with Table Service selected, if the technical item exists in catalog.json
  // Then it will also be added to the basket
  public tableServiceItem: string;
  public promoDiscountsMode = PromoDiscountsMode.FULL_DISCOUNT;
  public roundingStrategy = RoundingStrategies.ROUND_TO_NEAREST_OR_AWAY_FROM_ZERO;
  public unlockOrder = true;
  public tableServiceNumberPrefix: string;
  public sendModifiersWithZeroQuantity = false;
  public reloadAfterCompletedOrders = 0;
  public touchlessMode = false;
  public SubtotalIncludesVAT = 1;
  public infiniteNavbarScroll = false;

  constructor(@Inject('APP_SETTINGS') private appSettings: AtpApplicationSettings) {
    this.mapSettings();
  }

  public mapSettings() {
    this.sharedFolderPath = this.appSettings.bundleSettingsJson.sharedFolderPath;
    this.bridgeAssetsPath = `${this.sharedFolderPath}/assets`;
    this.skipPrecalculate = this.setBundleBoolean('skipPrecalculate');
    this.posInjectionFlow = this.setBundleOrDefault('posInjectionFlow');
    this.maxPaymentRetries = this.setBundleNumber('maxPaymentRetries');

    this.paymentFailRedirect =
      this.posInjectionFlow === CheckoutType.PAY_BEFORE_POS
        ? PaymentFailType.PAY_RETRY
        : this.appSettings.bundleSettingsJson.paymentFailRedirect
        ? this.appSettings.bundleSettingsJson.paymentFailRedirect
        : this.paymentFailRedirect;

    this.defaultLanguage = this.appSettings.bundleSettingsJson.defaultLanguage;
    this.languages = this.setBundleArray('languages');
    this.currencySymbol = this.setBundleOrDefault('currencySymbol');
    this.currencySymbolBefore = this.setBundleBoolean('currencySymbolBefore');
    this.decimalSeparator = this.setBundleOrDefault('decimalSeparator');
    this.posInjectorPathTest = `${this.appSettings.bundleSettingsJson.posInjectorPath}/pos/testconnect`;
    this.posInjectorPath = `${this.appSettings.bundleSettingsJson.posInjectorPath}/pos/transaction`;
    this.reverseBasketOrder = this.setBundleOrDefault('reverseBasketOrder');
    this.orderCheckInFlow = this.setBundleOrDefault('orderCheckInFlow');
    this.serviceType = this.setBundleOrDefault('serviceType');
    this.enableTouchToOrderSection = this.setBundleBoolean('enableTouchToOrderSection');
    this.peripheralsCheckTimer = this.setBundleOrDefault('peripheralsCheckTimer');
    this.paymentCheckMode = this.setBundleOrDefault('paymentCheckMode');
    this.printerCheckMode = this.setBundleOrDefault('printerCheckMode');
    this.scannerCheckMode = this.setBundleOrDefault('scannerCheckMode');
    this.POSCheckMode = this.setBundleOrDefault('POSCheckMode');
    this.kioskId = this.appSettings.bundleSettingsJson.kioskId;
    this.paymentTypes = this.setBundleArray('paymentTypes');
    this.productRemovalWarning = this.setBundleBoolean('productRemovalWarning');
    this.quantityCalculated = this.setBundleOrDefault('quantityCalculated');
    this.homeButtonDisplay = this.setBundleOrDefault('homeButtonDisplay');
    this.viewBasketAfterProductSelection = this.setBundleOrDefault('viewBasketAfterProductSelection');
    this.inactivityWarningTimer = this.setBundleOrDefault('inactivityWarningTimer');
    this.inactivityCloseTimer = this.setBundleOrDefault('inactivityCloseTimer');
    this.calculateTotalMode = this.setBundleOrDefault('calculateTotalMode');
    this.skipSinglePaymentSelection = this.setBundleBoolean('skipSinglePaymentSelection');
    this.enableComboAnimation = this.setBundleBoolean('enableComboAnimation');
    this.nutritionalInformationDisplayType = this.setBundleOrDefault('nutritionalInformationDisplayType');
    this.tableServiceMode = this.setBundleOrDefault('tableServiceMode');
    this.printStoreDetails = this.setBundleBoolean('printStoreDetails');
    this.storeName = this.appSettings.bundleSettingsJson.storeName;
    this.storeCode = this.appSettings.bundleSettingsJson.storeCode;
    this.storeAddress1 = this.appSettings.bundleSettingsJson.storeAddress1;
    this.storeAddress2 = this.appSettings.bundleSettingsJson.storeAddress2;
    this.storeTelephone = this.appSettings.bundleSettingsJson.storeTelephone;
    this.printPOSReceipt = this.setBundleBoolean('printPOSReceipt');
    this.paymentRetryCounter = this.setBundleNumber('paymentRetryCounter');
    this.receiptEFTPartialCut = this.setBundleBoolean('receiptEFTPartialCut');
    this.promoInputOption =
      !this.appSettings.bundleSettingsJson.promoInputOption ||
      (this.appSettings.bundleSettingsJson.promoInputOption !== PromoInputOption.KEYBOARD &&
        this.appSettings.bundleSettingsJson.promoInputOption !== PromoInputOption.SCANNER)
        ? PromoInputOption.BOTH
        : this.appSettings.bundleSettingsJson.promoInputOption;
    this.gloryPayableAmount = this.setBundleOrDefault('gloryPayableAmount');
    this.enabledTouchlessDM = this.setBundleBoolean('enabledTouchlessDM');
    this.enableOMSModule = this.setBundleBoolean('enableOMSModule');
    this.enableOMSRecall = this.setBundleBoolean('enableOMSRecall');
    this.tableServiceItem = this.setBundleString('tableServiceItem');
    this.promoDiscountsMode = this.setBundleOrDefault('promoDiscountsMode');
    this.roundingStrategy = this.setBundleOrDefault('roundingStrategy');
    this.unlockOrder = this.setBundleBoolean('unlockOrder');
    this.tableServiceNumberPrefix = this.setBundleString('tableServiceNumberPrefix');
    this.sendModifiersWithZeroQuantity = this.setBundleBoolean('sendModifiersWithZeroQuantity');
    this.reloadAfterCompletedOrders = this.setBundleOrDefault('reloadAfterCompletedOrders');
    this.touchlessMode = this.setBundleBoolean('touchlessMode');
    this.SubtotalIncludesVAT = this.setBundleNumber('SubtotalIncludesVAT');
    this.infiniteNavbarScroll = this.setBundleBoolean('infiniteNavbarScroll');
  }

  private setBundleOrDefault(displayName: string) {
    return this.appSettings.bundleSettingsJson[displayName] || this[displayName];
  }

  private setBundleBoolean(displayName: string): boolean {
    return typeof this.appSettings.bundleSettingsJson[displayName] === 'boolean'
      ? this.appSettings.bundleSettingsJson[displayName]
      : this[displayName];
  }

  private setBundleString(displayName: string): string {
    return this.appSettings.bundleSettingsJson[displayName] || '';
  }

  private setBundleNumber(displayName: string): number {
    return Number.isInteger(this.appSettings.bundleSettingsJson[displayName])
      ? this.appSettings.bundleSettingsJson[displayName]
      : this[displayName];
  }

  private setBundleArray(displayName: string): any[] {
    return this.appSettings.bundleSettingsJson[displayName]
      ? JSON.parse(this.appSettings.bundleSettingsJson[displayName].replaceAll('\'', '"'))
      : [];
  }
}
