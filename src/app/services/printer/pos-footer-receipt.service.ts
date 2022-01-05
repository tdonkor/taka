import { Injectable } from '@angular/core';
import { DotCdkTranslatePipe } from '../../pipes/dot-translate.pipe';
import { getMultipleLineText } from '../../helpers/text-receipt.helper';
import { PrintReceiptBuilder } from './print-receipt-builder.service';
import { LocalizationService } from '../localization.service';


@Injectable({
  providedIn: 'root'
})
export class PosFooterReceiptService {
  constructor(
    private printReceiptBuilder: PrintReceiptBuilder,
    private translatePipe: DotCdkTranslatePipe,
    private localizationService: LocalizationService
  ) { }

  public getPosFooterReceipt(): string {
    this.printReceiptBuilder.toCenter('on');
    this.printReceiptBuilder.addContent(this.translatePipe.transform('2021020501'));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(getMultipleLineText(this.translatePipe.transform('2021020502')));
    this.printReceiptBuilder.newLine(1);
    return this.printReceiptBuilder.getContent;
  }
  public addCheckClosedOnReceipt(): string {
    this.printReceiptBuilder.toCenter('on');
    this.printReceiptBuilder.addContent(this.translatePipe.transform('2021020904'));
    this.printReceiptBuilder.newLine(1);
    // print date
    this.printReceiptBuilder.addContent('         ' + this.localizationService.formatDate(new Date(), 'M/d/yyyy h:mm A'));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(this.translatePipe.transform('2021020905'));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(this.translatePipe.transform('2021020906'));
    this.printReceiptBuilder.newLine(1);
    this.printReceiptBuilder.addContent(getMultipleLineText(this.translatePipe.transform('2021020903')));
    this.printReceiptBuilder.newLine(3);
    return this.printReceiptBuilder.getContent;
  }


}
