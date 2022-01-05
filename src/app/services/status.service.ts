import {
  CashInventoryOverallStatus,
  CoreProducerTypes,
  MessageBroker,
  PeripheralCheckEntry,
  PeripheralCheckMode,
  PeripheralCheckProducerMessage
} from 'dotsdk';
import { CheckoutType, KioskStatusColor, PAYMENT_TYPE, PaymentType } from '../models';
import { Subject } from 'rxjs';

import { ApplicationSettingsService } from './app-settings.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  public onNewSdkPeripheralCheck: Subject<PeripheralCheckProducerMessage> = new Subject();
  private _paymentsAvailableForApp: PaymentType[] = [];
  private _isScannerAvailableForApp = false;

  constructor(
    private appSettings: ApplicationSettingsService
  ) {}

  
  public startSdkPeripheralCheck() {
    MessageBroker.getInstance().subscribe(CoreProducerTypes.PERIPHERALS_CHECK, (value: PeripheralCheckProducerMessage)=>{

      this.mutateCashPeripheralsBasedOnInventoryStatus(value.entries);
      this._paymentsAvailableForApp = this.getAvailablePayments(value);
      this._isScannerAvailableForApp = !!this.findAvailableScanner(value);
      
      this.onNewSdkPeripheralCheck.next(value);
    })
  }

  public get paymentsAvailableForApp(): PaymentType[] {
    return this._paymentsAvailableForApp;
  }
  public get isScannerAvailableForApp(): boolean {
    return this._isScannerAvailableForApp;
  }

  /**
   * Evaluate Cash entries based on cash inventory status. If cash inventory is not OK then consider 
   * that specific entries as being in an error state
   * @param entries 
   */
  private mutateCashPeripheralsBasedOnInventoryStatus(entries: PeripheralCheckEntry[]) {
    entries .filter(entry => entry.peripheralType === "Payment" && entry.peripheralSubtype === PAYMENT_TYPE.CASH && !entry.error)
            .forEach(entry => {
              if (entry.metadata.inventoryStatus.overallStatus === CashInventoryOverallStatus.NOT_OK){
                entry.error = true;
                entry.errorCode = -1;
                entry.message = 'Glory internal inventory is full or dispensable inventory is empty.';
                if(entry.checkTypeCode === PeripheralCheckMode.Mandatory){
                  entry.metadata.block = true;
                }
              }
            });
  }

  private getAvailablePayments(value: PeripheralCheckProducerMessage) {

    const _paymentsAvailableForApp = [];
    const preorderStatus = this.getPreorderStatus();
    if (preorderStatus) {
      _paymentsAvailableForApp.push(preorderStatus);
    }
    const cardStatus = this.appSettings.paymentTypes.find((p) => {
      return p.PaymentType === PAYMENT_TYPE.CARD && p.PaymentIsEnabled && value.entries.find(q => { 
        return q.peripheralType === "Payment" && q.peripheralSubtype === PAYMENT_TYPE.CARD && !q.error;
      })
    });
    if(cardStatus) {
      cardStatus.DisplayName = '61';
      _paymentsAvailableForApp.push(cardStatus)
    }

    const cashStatus = this.appSettings.paymentTypes.find((p) => {
      return p.PaymentType === PAYMENT_TYPE.CASH && p.PaymentIsEnabled && value.entries.find(q => { 
        return  q.peripheralType === "Payment" && q.peripheralSubtype === PAYMENT_TYPE.CASH && !q.error;
      })
    });
    if(cashStatus) {
      cashStatus.DisplayName = '2021021901';
      _paymentsAvailableForApp.push(cashStatus)
    }

    return _paymentsAvailableForApp;
  }

  private getPreorderStatus(): PaymentType {
    if (this.appSettings.posInjectionFlow === CheckoutType.PAY_BEFORE_POS) {
      return null;
    }
    const preorderPayment = this.appSettings.paymentTypes.find((p) => p.PaymentType === PAYMENT_TYPE.PREORDER && p.PaymentIsEnabled);
    if (preorderPayment) {
      preorderPayment.DisplayName = '62';
      return preorderPayment;
    }
    return null;
  }

  private findAvailableScanner(value: PeripheralCheckProducerMessage): PeripheralCheckEntry {
    return value.entries.find(q => { 
      return  q.peripheralType === "Scanner" && q.peripheralSubtype === 'scanner' && !q.error;
    })
  }

  public isKioskBlockedDueToPeripherals(value: PeripheralCheckProducerMessage): boolean {
    // check if at least one non payment peripheral is in blocking state
    const isNonPaymentPeripheralsBlocking = value.entries.filter(entry => entry.peripheralType !== 'Payment').some(nonPaymentEntry => nonPaymentEntry.metadata.block);

    // check if al least one payment is enabled and not blocking
    const enabledPaymentTypes = this.appSettings.paymentTypes.filter((p) => p.PaymentIsEnabled);
    const paymentEntries = value.entries.filter(entry => entry.peripheralType === 'Payment');
    const isPaymentMandatory = this.appSettings.paymentCheckMode === PeripheralCheckMode.Mandatory;
    const isAtLeastOneEnabledPaymentPeripheralAvailable = paymentEntries.some(paymentEntry => {
      return enabledPaymentTypes.some(enabledPaymentType => paymentEntry.peripheralSubtype === enabledPaymentType.PaymentType && !paymentEntry.metadata.block)
    });
    const isPreorderEnabled = !!this.getPreorderStatus();

    const isPaymentPeripheralsBlocking = !isAtLeastOneEnabledPaymentPeripheralAvailable && !isPreorderEnabled && isPaymentMandatory;

    
    return isNonPaymentPeripheralsBlocking || isPaymentPeripheralsBlocking;
  }

  public getKioskStatusColor(value: PeripheralCheckProducerMessage): KioskStatusColor {
    const isCashAvailable = value.entries.some((p) =>  p.peripheralType === "Payment" && p.peripheralSubtype === PAYMENT_TYPE.CASH && !p.error);
    const isCashEnabledInBS = this.appSettings.paymentTypes.some((p) => p.PaymentType === PAYMENT_TYPE.CASH && p.PaymentIsEnabled);
    const isCashInventoryWarn = value.entries.some((p) => p.peripheralType === "Payment" && p.peripheralSubtype === PAYMENT_TYPE.CASH && p.metadata.inventoryStatus.overallStatus === CashInventoryOverallStatus.WARNING);
    // const isCashInventoryNOK = value.entries.some((p) => p.peripheralType === PAYMENT_TYPE.CASH && p.metadata.inventoryStatus.overallStatus === CashInventoryOverallStatus.NOT_OK);
    const isCardAvailable = value.entries.some((p) =>  p.peripheralType === "Payment" && p.peripheralSubtype === PAYMENT_TYPE.CARD && !p.error);
    const isCardEnabledInBS = this.appSettings.paymentTypes.some((p) => p.PaymentType === PAYMENT_TYPE.CARD && p.PaymentIsEnabled);
    
    if (isCardEnabledInBS && !isCardAvailable && isCashEnabledInBS && !isCashAvailable) {
      return KioskStatusColor.RED;
    } 
    if (isCashEnabledInBS && !isCashAvailable) {
      return KioskStatusColor.BLUE;
    } 
    if (isCardEnabledInBS && !isCardAvailable) {
      return KioskStatusColor.PURPLE;
    } 
    if (isCashEnabledInBS && isCashAvailable && isCashInventoryWarn ) {
      return KioskStatusColor.ORANGE;
    }
    return KioskStatusColor.NO_COLOR;
  }
}
