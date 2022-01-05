import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { DotButton, calculateButtonPrice } from 'dotsdk';
import { BasketService } from '../basket.service';
import { SessionService } from '../session.service';
import { PrintReceiptBuilder } from './print-receipt-builder.service';
import { DotCdkTitleTranslatePipe } from '../../pipes/dot-title-translate.pipe';


@Injectable({
  providedIn: 'root'
})
export class OrderContentReceiptService {
  constructor(
    private printReceiptBuilder: PrintReceiptBuilder,
    private basketService: BasketService,
    private translateTitlePipe: DotCdkTitleTranslatePipe,
    private sessionService: SessionService
  ) { }

  public getOrderContent(): string {
    const basketButtons = _.cloneDeep(this.basketService.buttons);
    basketButtons.forEach(button => {
      this.printProduct(button);
    });
    this.printReceiptBuilder.newLine(1);
    return this.printReceiptBuilder.getContent;
  }

  private getName(button: DotButton): string {
    let productSName = button.CaptionDictionary ?
      this.translateTitlePipe.transform(button.CaptionDictionary) :
      button.Caption;
    if (productSName && productSName.indexOf('|') > -1) {
      productSName = productSName.substring(0, productSName.indexOf('|'));
    }
    return productSName;
  }

  private printProduct(button: DotButton) {
    if (!this.isPrinterVisible(button)) {
      return;
    }
    const buttonPrice = (calculateButtonPrice(button, this.sessionService.serviceType) / 100).toFixed(2);
    const productName = this.getName(button);
    this.printReceiptBuilder.addContent(
      this.printReceiptBuilder.alignToRight(button.quantity.toString(), 3, true) + ' ' +
      this.printReceiptBuilder.alignToLeft(productName, 27, false) + ' ' +
      this.printReceiptBuilder.alignToRight(buttonPrice, 7, true));
    this.printReceiptBuilder.newLine(1);
    if (button.hasModifiers) {
      this.printModifier(button);
    }
    if (button.hasCombos) {
      button.ComboPage.Combos.forEach(combo => {
        const comboComponentButton = combo.Buttons.find(btn => btn.Selected === true);
        if (comboComponentButton  && this.isPrinterVisible(comboComponentButton)) {
          this.printReceiptBuilder.addContent(
            '      ' + this.printReceiptBuilder.alignToLeft(this.getName(comboComponentButton), 23, false));
          this.printReceiptBuilder.newLine(1);
          if (comboComponentButton.hasModifiers) {
            this.printModifier(comboComponentButton, true);
          }
        }
      });
    }
    return this.printReceiptBuilder.getContent;
  }

  private printModifier(button, isCombo = false) {
    const frontSpace = isCombo ? '      ' : '    ';
    const modifierNameLength = isCombo ? 21 : 23;
    button.activeModifiers.forEach(x => {
      x.selectedButtons.forEach(y => {
        const modifierName = this.getName(y);
        const modifierPrice = (calculateButtonPrice(y, this.sessionService.serviceType) / 100).toFixed(2);
        const textPrice = (modifierPrice && modifierPrice !== '0.00') ? ' ' + this.printReceiptBuilder.alignToRight(modifierPrice, 7, true) : '';
        (y.quantity > 1) ?
          this.printReceiptBuilder.addContent(
            frontSpace +
            this.printReceiptBuilder.alignToRight(y.quantity.toString(), 3, true) + ' ' +
            this.printReceiptBuilder.alignToLeft(modifierName, modifierNameLength, false) + textPrice) :
          this.printReceiptBuilder.addContent(
            frontSpace + '  ' +
            this.printReceiptBuilder.alignToLeft(modifierName, modifierNameLength + 2, false) + textPrice);
        this.printReceiptBuilder.newLine(1);
      });
    });
  }

  private isPrinterVisible(button: DotButton): boolean {
    if (!button) {
      return false;
    }
    if (typeof button.Visibility  === 'string') {
      const visibilityNumber = Number(button.Visibility);
      if (Number.isInteger(visibilityNumber)) {
        return !((visibilityNumber & 16) === 16);
      }
    }
    return true;
  }
}
