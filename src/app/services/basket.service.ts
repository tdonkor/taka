import { Inject, Injectable, Type } from '@angular/core';
import { DotButton, omitPropertiesInObject, addToCartEvent, removeFromCartEvent, calculateButtonPrice, OMSEventsFacade, DotSessionService, PromotionsService, OrderDiscountResponse, DotConditionsService } from 'dotsdk';
import { Subject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { ApplicationSettingsService } from './app-settings.service';
import { Router } from '@angular/router';
import { generateUUID } from '../helpers/uuid.helper';
import { DOCUMENT } from '@angular/common';
import { PromosService } from './promos.service';
import { DynamicContentService } from './dynamic-content/dynamic-content.service';
import { AbstractDynamicComponent } from './dynamic-content/models/abstract-dynamic.component';

@Injectable({
  providedIn: 'root',
})
export class BasketService {
  protected isOpen = false;
  protected _buttons: DotButton[] = [];
  protected _basketButtonsUpdate: Subject<DotButton[]> = new Subject();

  public get buttons(): DotButton[] {
    return this._buttons;
  }

  public get totalPrice(): number {
    return this.calculateTotalPrice(this._buttons);
  }

  public get basketButtonsUpdate(): Observable<DotButton[]> {
    return this._basketButtonsUpdate.asObservable();
  }

  constructor(
    protected appSettingsService: ApplicationSettingsService,
    protected dynamicContentService: DynamicContentService,
    protected router: Router,
    protected promoService: PromosService,
    @Inject(DOCUMENT) protected _document: any,
  ) {}

  public addButtonToBasket(button: DotButton, addOnlyOne = false): void {
    button = _.cloneDeep(button);
    const indexSameUuid = this._buttons.findIndex((b) => button.uuid === b.uuid);
    const indexSameButton = this._buttons.findIndex((b) => this.areButtonsSimilar(b, button));
    if (indexSameButton >= 0 && !button.isChanged) {
      if (button.quantity > 1) {
        addOnlyOne ? this._buttons[indexSameButton].quantity++ : this._buttons[indexSameButton].quantity += button.quantity;
      } else {
        this._buttons[indexSameButton].quantity++;
      }
      if (button['parentLinkUUID']) {
        this._buttons.forEach(btn => {
          if (btn['childLinkUUID'] && btn['childLinkUUID'] === this._buttons[indexSameButton]['parentLinkUUID']) {
            btn['childLinkUUID'] = button['parentLinkUUID'];
          }
        });
        this._buttons[indexSameButton]['parentLinkUUID'] = button['parentLinkUUID'];
      }
    } else if (indexSameButton < 0 && button.isChanged) {
      this._buttons.splice(indexSameUuid, 1, button);
    } else if (indexSameButton >= 0 && button.isChanged) {
        if (indexSameButton === indexSameUuid) {
          this._buttons.splice(indexSameUuid, 1, button);
        } else {
          this._buttons[indexSameButton].quantity += button.quantity;
          this._buttons.splice(indexSameUuid, 1);
        }
    } else {
      button.uuid = button.uuid || generateUUID();
      if (this.appSettingsService.reverseBasketOrder) {
        this._buttons.unshift(button);
      } else {
        this._buttons.push(button);
      }
    }
    button.isChanged = false;
    this._basketButtonsUpdate.next(this._buttons);
    addToCartEvent.emit(this._buttons);
    // this.cdkBasketService.buttons.length = 0;
    // this._buttons.forEach(btn => this.cdkBasketService.buttons.push(btn));
    if (this.appSettingsService.enableOMSModule && this.appSettingsService.enableOMSRecall) {
      new OMSEventsFacade().recallEvent(this.totalPrice, false).subscribe(() => null);
    }
    this.checkOrderDiscount();

  }
  public removeButtonFromBasket(button: DotButton, removeAllButtons = false): void {
    const index = this._buttons.findIndex((x) => x.uuid === button.uuid);
    if (index >= 0 && removeAllButtons) {
      this._buttons.splice(index, 1);
    } else if (index >= 0 && this._buttons[index].quantity > 1) {
      this._buttons[index].quantity--;
    } else if (index >= 0) {
      this._buttons.splice(index, 1);
    } else {
      return;
    }

    if (button['parentLinkUUID']) {
      this._buttons.filter(btn => btn['childLinkUUID'] === button['parentLinkUUID'])
                   .forEach(b => this.removeButtonFromBasket(b, true));
    }
    this._buttons = this._buttons.filter(btn => !btn['IFC'] || btn['IFC'] && DotConditionsService.getInstance().evaluateCondition(btn['IFC'], this._buttons));
    this._basketButtonsUpdate.next(this._buttons);
    removeFromCartEvent.emit(this._buttons);
    // this.cdkBasketService.buttons.length = 0;
    // this._buttons.forEach(btn => this.cdkBasketService.buttons.push(btn));
    if (this.appSettingsService.enableOMSModule && this.appSettingsService.enableOMSRecall) {
      new OMSEventsFacade().recallEvent(this.totalPrice, false).subscribe(() => null);
    }
    this.checkOrderDiscount();
  }
  public resetBasket(): void {
    this._buttons = [];
    // this.cdkBasketService.buttons.length = 0;
  }
  public getQuantityButtons(): number {
    return this.buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
  }
  public calculateTotalPrice(buttons: DotButton[]): number {
    return buttons.reduce((acc: number, button: DotButton) => {
      return acc + Number(calculateButtonPrice(button, DotSessionService.getInstance().currentPosServingLocation)) * button.quantity;
    }, 0);
  }
  public basketToggle(basketComponent: Type<AbstractDynamicComponent>): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this._document.body.classList.add('basketOpened');
      const contentRef = this.dynamicContentService.openContent(basketComponent, {});
      const contentRefSubscription = contentRef.afterClosed.subscribe(() => {
        this.isOpen = false;
        this._document.body.classList.remove('basketOpened');
        contentRefSubscription.unsubscribe();
      });
    } else {
      this.dynamicContentService.closeAllDialogs();
    }
  }

  public openBasket(basketComponent: Type<AbstractDynamicComponent>): void {
    if (this.router.url !== '/cod-view') {
      if (this.isOpen) {
        this.dynamicContentService.closeAllDialogs();
      }
      this.basketToggle(basketComponent);
      return;
    }
    this.basketToggle(basketComponent);
  }
  public areButtonsSimilar(button1: DotButton, button2: DotButton): boolean {
    if (button1.Link !== button2.Link || button1.isPromo !== button2.isPromo ||
      ((button1['childLinkUUID'] || button2['childLinkUUID']) && button1['childLinkUUID'] !== button2['childLinkUUID'])) {
      return false;
    }
    const samePromo = button1['Promo'] === button2['Promo'];
    const omitPropertiesModifiers = [];
    const sameModifiers =
      (!button1.hasModifiers && !button2.hasModifiers) ||
      _.isEqual(
        omitPropertiesInObject(button1.ModifiersPage, omitPropertiesModifiers),
        omitPropertiesInObject(button2.ModifiersPage, omitPropertiesModifiers)
      );
    const omitPropertiesCombos = omitPropertiesModifiers.concat(['StartSize', 'selectedSize']);
    const sameCombos =
      (!button1.hasCombos && !button2.hasCombos) ||
      _.isEqual(
        omitPropertiesInObject(button1.ComboPage, omitPropertiesCombos),
        omitPropertiesInObject(button2.ComboPage, omitPropertiesCombos)
      );
    return samePromo && sameModifiers && sameCombos;
  }

  protected checkOrderDiscount() {
    const orderDiscountButton = this._buttons.find(btn => Number.isInteger(btn['$$OrderDiscount']));
    if (orderDiscountButton) {
      const promotionService = new PromotionsService();
      orderDiscountButton['$$OrderDiscount'] = (promotionService.reevaluateOrderDiscount()?.promoPayload as OrderDiscountResponse)?.discountedAmount;
    }
  }
}
