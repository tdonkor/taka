import { Component, OnDestroy, OnInit } from '@angular/core';
import { PeripheralCheckProducerMessage, PeripheralCheckMode } from 'dotsdk';
import { KioskStatusColor, PAYMENT_TYPE } from '@dotxix/models';
import { Subscription } from 'rxjs';
import { ApplicationSettingsService, StatusService } from '@dotxix/services';
import { DotCdkTranslatePipe } from '@dotxix/pipes';

@Component({
  selector: 'acr-status',
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnInit, OnDestroy {
  public messages: string[] = [];
  public subscriptions: Subscription[] = [];
  protected kioskStatusColor: KioskStatusColor = KioskStatusColor.NO_COLOR;

  public get statusBulletColorClass(): string {
    switch (this.kioskStatusColor) {
      case KioskStatusColor.NO_COLOR:
        return '';
      case KioskStatusColor.BLUE:
        return 'bg--blue';
      case KioskStatusColor.ORANGE:
        return 'bg--orange';
      case KioskStatusColor.RED:
        return 'bg--red';
      case KioskStatusColor.PURPLE:
        return 'bg--purple';
      default:
        return '';
    }
  }

  constructor(protected statusService: StatusService, protected translatePipe: DotCdkTranslatePipe, protected appSettings: ApplicationSettingsService) {}

  public ngOnInit() {
    this.subscriptions.push(
      this.statusService.onNewSdkPeripheralCheck.subscribe((value: PeripheralCheckProducerMessage) => {
        this.kioskStatusColor = this.statusService.getKioskStatusColor(value);
        this.messages = this.getCustomizedMessages(value);        
      })
    );
  }

  private getCustomizedMessages(value: PeripheralCheckProducerMessage): string[]{

    const isCashEnabledInBS = this.appSettings.paymentTypes.some((p) => p.PaymentType === PAYMENT_TYPE.CASH && p.PaymentIsEnabled);
    const isCardEnabledInBS = this.appSettings.paymentTypes.some((p) => p.PaymentType === PAYMENT_TYPE.CARD && p.PaymentIsEnabled);

    const paymentPeripherals = value.entries.filter(entry => entry.peripheralType === "Payment");
    const isCashMissingWhenMandatory = paymentPeripherals.every(entry => entry.peripheralSubtype !== PAYMENT_TYPE.CASH && entry.checkTypeCode === PeripheralCheckMode.Mandatory);
    const isCardMissingWhenMandatory = paymentPeripherals.every(entry => entry.peripheralSubtype !== PAYMENT_TYPE.CARD && entry.checkTypeCode === PeripheralCheckMode.Mandatory);

    const messages = value.entries
      // take into account payment errors only if the payment type is enabled from BS
      .filter (entry => {
        const isEntryBlocking = entry.metadata.block;
        const isPaymentType = entry.peripheralType === "Payment";
        if(isEntryBlocking) {
          if(isPaymentType) {
            return  (entry.peripheralSubtype === PAYMENT_TYPE.CARD && isCardEnabledInBS) || 
                    (entry.peripheralSubtype === PAYMENT_TYPE.CASH && isCashEnabledInBS);
          } else {
            return true;
          }
        }
      })

      .map(entry => `${entry.peripheralType} (${entry.peripheralName}) - ${entry.message}`);


    if (isCardEnabledInBS && isCardMissingWhenMandatory){
      messages.push('Payment (N/A) - No EFT payment terminal is set in the ATP environment');
    }

    if (isCashEnabledInBS && isCashMissingWhenMandatory){
      messages.push('Payment (N/A) - No cash payment peripheral is set in the ATP environment');
    }


    if (this.statusService.isKioskBlockedDueToPeripherals(value)) {
      messages.push(this.translatePipe.transform('2020122101'));
    }
    return messages;
  }


  public ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
