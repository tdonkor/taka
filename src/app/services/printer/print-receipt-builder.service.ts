import { Injectable } from '@angular/core';
import { ReceiptContentBuilder } from 'dotsdk';

@Injectable({
  providedIn: 'root',
})
export class PrintReceiptBuilder {
  protected sdkReceiptBuilder = new ReceiptContentBuilder();

  constructor() {}

  public get getContent(): string {
    return this.sdkReceiptBuilder.content;
  }

  public get defaultReceiptWidth(): number {
    return this.sdkReceiptBuilder.printerMaxCharsPerRow;
  }

  public clearContent() {
    this.sdkReceiptBuilder.clearContent();
  }

  public lineSeparator(character: string = '-'): string {
    return this.sdkReceiptBuilder.addHorizontalSeparator(character);
  }

  public newLine(count: number = 1): string {
    return this.sdkReceiptBuilder.addLineBreaks(count);
  }

  public cut(): string {
    return this.sdkReceiptBuilder.cut();
  }

  public addImage(imagePath: string = 'assets/images/logo.png'): string {
    return this.sdkReceiptBuilder.addImage(imagePath);
  }

  public magnification(zoomLevel: 2 | 3 | 4): string {
    return this.sdkReceiptBuilder.magnifyStart(zoomLevel);
  }

  public endMagnification(): string {
    return this.sdkReceiptBuilder.magnifyEnd();
  }

  public toCenter(value: 'on' | 'off'): string {
    return this.sdkReceiptBuilder.alignCenter(value);
  }

  public bold(value: 'on' | 'off'): string {
    return this.sdkReceiptBuilder.bold(value);
  }

  public addContentToSides(contentLeft: string, contentRight: string, connectionCharacter: string = '.'): string {
    return this.sdkReceiptBuilder.addContentToSides(contentLeft, contentRight, connectionCharacter);
  }

  public alignToLeft(lStr: string, desiredLength: number, aTrim: boolean): string {
    if (!lStr) {
      lStr = '';
    }
    if (aTrim) {
      // lStr = lStr.replace(/\s/g, '');
      lStr = lStr.trim();
    }
    if (lStr.length > desiredLength) {
      lStr = lStr.slice(0, desiredLength);
    } else {
      while (lStr.length < desiredLength) {
        lStr += ' ';
      }
    }
    return lStr;
  }

  public alignToRight(lStr: string, desiredLength: number, aTrim: boolean): string {
    if (!lStr) {
      lStr = '';
    }
    if (aTrim) {
      lStr = lStr.trim();
    }
    if (lStr.length > desiredLength) {
      lStr = lStr.slice(0, desiredLength);
    } else {
      while (lStr.length < desiredLength) {
        lStr = ' ' + lStr;
      }
    }
    return lStr;
  }

  public addContent(content: string): string {
    return content ? this.sdkReceiptBuilder.addContent(content.charAt(0).toUpperCase() + content.slice(1)) : '';
  }
}
