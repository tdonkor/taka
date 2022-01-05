import { Injectable } from '@angular/core';
import { PosServingLocation } from 'dotsdk';
import { DotCdkTranslatePipe } from '../../pipes/dot-translate.pipe';
import { ApplicationSettingsService } from '../app-settings.service';
import { LocalizationService } from '../localization.service';
import { SessionService } from '../session.service';
import { PrintReceiptBuilder } from './print-receipt-builder.service';


@Injectable({
  providedIn: 'root'
})
export class HeaderReceiptService {
  constructor(
    private printReceiptBuilder: PrintReceiptBuilder,
    private appSettings: ApplicationSettingsService,
    private translatePipe: DotCdkTranslatePipe,
    private sessionService: SessionService,
    private localizationService: LocalizationService
  ) { }

  public getReceiptHeader(orderNumber: string): string {
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.toCenter('on');
    this.printReceiptBuilder.addContent(this.translatePipe.transform('2021020401'));
    this.printReceiptBuilder.newLine(1);
    if (this.appSettings.printStoreDetails) {
      if (this.appSettings.storeName) {
        this.printReceiptBuilder.addContent(this.appSettings.storeName);
        this.printReceiptBuilder.newLine(1);
      }
      if (this.appSettings.storeCode) {
        this.printReceiptBuilder.addContent(this.translatePipe.transform('2021020402') + ' ' + this.appSettings.storeCode);
        this.printReceiptBuilder.newLine(1);
      }
      if (this.appSettings.storeAddress1) {
        this.printReceiptBuilder.addContent(this.appSettings.storeAddress1);
        this.printReceiptBuilder.newLine(1);
      }
      if (this.appSettings.storeAddress2) {
        this.printReceiptBuilder.addContent(this.appSettings.storeAddress2);
        this.printReceiptBuilder.newLine(1);
      }

      if (this.appSettings.storeTelephone) {
        this.printReceiptBuilder.addContent(this.appSettings.storeTelephone);
        this.printReceiptBuilder.newLine(1);
      }
    }
    // print order number
    this.printReceiptBuilder.toCenter('off');
    this.printReceiptBuilder.lineSeparator();
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.toCenter('on');
    this.printReceiptBuilder.addContent(this.translatePipe.transform('34') + ': ' + orderNumber);
    this.printReceiptBuilder.newLine(1);
    // print date
    this.printReceiptBuilder.addContent('         ' + this.localizationService.formatDate(new Date(), 'M/d/yyyy h:mm A'));
    this.printReceiptBuilder.toCenter('off');
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.lineSeparator();
    this.printReceiptBuilder.newLine(1);
    // print service type
    if (this.sessionService.serviceType === PosServingLocation.IN) {
      this.printReceiptBuilder.addContent('    ');
      this.printReceiptBuilder.addContent(this.translatePipe.transform('11'));
    } else {
      this.printReceiptBuilder.addContent('    ');
      this.printReceiptBuilder.addContent(this.translatePipe.transform('12'));
    }
    this.printReceiptBuilder.newLine(1);
    return this.printReceiptBuilder.getContent;
  }


}
