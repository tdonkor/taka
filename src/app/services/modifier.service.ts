import { Injectable } from '@angular/core';
import { DotButton, DotButtonType, DotModifier } from 'dotsdk';

@Injectable({
  providedIn: 'root',
})
export class ModifiersService {
  public _maxQuantityGroup: number;
  public _minQuantityGroup: number;
  public _classicModifiers: DotButton[] = [];

  public get classicModifiers(): DotButton[] {
    return this._classicModifiers;
  }

  public get maxQuantityGroup(): number {
    return this._maxQuantityGroup;
  }

  public get minQuantityGroup(): number {
    return this._minQuantityGroup;
  }

  constructor() {

  }
  public personalizeButton(modifier: DotButton, classicModifierList: DotModifier, getQuantityButtons: number, subgroupModifiers?: DotButton[]) {
    if (subgroupModifiers?.length > 0) {
      this._classicModifiers = subgroupModifiers;
    } else {
      this._classicModifiers = classicModifierList.Buttons;
    }
    this._maxQuantityGroup = classicModifierList.PageInfo.MaxQuantity;
    this._minQuantityGroup = classicModifierList.PageInfo.MinQuantity ? classicModifierList.PageInfo.MinQuantity : 0;
    this.classicModifiers.map(modif => {
      if (this.maxQuantityGroup === 1) {
        if (this.classicModifiers.length === 1) {
          this.selectDeselectItem(modif);
        } else {
          if (this.classicModifiers.some(x => x.MinQuantity === 1) && this.classicModifiers.length >= 2) {
            return;
          } else {
            this.toogleBetweenItems(modifier, modif);
          }
        }
      }
      if (this.maxQuantityGroup > 1) {
        if (this.classicModifiers.length === 1) {
          if (modif.MaxQuantity === 1) {
            this.selectDeselectItem(modif);
          } else if (modif.MaxQuantity > 1) {
            this.increaseQuantityModifier(modifier);
          }
        } else if (this.classicModifiers.length === 2) {
          if (modif.MaxQuantity === 1) {
            this.toogleMultipleItems(modifier, modif, getQuantityButtons);
          } else {
            this.increaseQuantityBucketStandard(1, modifier, modif, getQuantityButtons);
          }
        } else if (this.classicModifiers.length > 2 && modif.MaxQuantity === 1) {
          this.toogleMultipleItems(modifier, modif, getQuantityButtons);
        } else {
          if (modifier.Link === modif.Link && getQuantityButtons < this.maxQuantityGroup && this.classicModifiers.length > 2) {
            if (modifier.quantity < modifier.MaxQuantity) {
              this.increaseQuantityModifier(modifier);
            }
          }
        }
      }
    });
  }

  public selectDeselectItem(modifier: DotButton): void {
    if (modifier.MinQuantity !== 1) {
      modifier.Selected = !modifier.Selected;
      modifier.quantity = modifier.Selected ? 1 : 0;
    }
  }

  public toogleBetweenItems(modifier: DotButton, modifierItemList: DotButton): void {
    this.selectDeselectItem(modifierItemList);
    if (modifier.Link !== modifierItemList.Link && modifier.MinQuantity !== 1) {
      modifierItemList.Selected = false;
      modifierItemList.quantity = 0;
    }
  }

  public toogleMultipleItems(modifier: DotButton, modifierItemList: DotButton, getQuantityButtons) {
    if (modifier.Link === modifierItemList.Link && getQuantityButtons < this.maxQuantityGroup) {
      this.selectDeselectItem(modifierItemList);
    } else if ((modifier.Link === modifierItemList.Link && modifierItemList.Selected && (modifier.MinQuantity !== 1 || !modifier.MinQuantity))) {
      modifierItemList.Selected = !modifierItemList.Selected;
      modifierItemList.quantity = 0;
    }
  }

  public increaseQuantityModifier(modifier: DotButton): void {
    modifier.Selected = true;
    if (modifier.quantity < this.maxQuantityGroup && modifier.quantity < modifier.MaxQuantity) {
      modifier.quantity++;
    }
  }

  public increaseQuantityBucketStandard(changedQuantity: number, modifier, modifierItemList, getQuantityButtons) {
    if (!modifierItemList.MinQuantity) {
      modifierItemList.MinQuantity = 0;
    }
    if (modifier.Link === modifierItemList.Link && getQuantityButtons < this.maxQuantityGroup && modifier.quantity < modifier.MaxQuantity) {
      modifier.Selected = true;
      modifier.quantity++;
    }
    if (modifier.Link !== modifierItemList.Link && modifierItemList.quantity > modifierItemList.MinQuantity && getQuantityButtons >= this.maxQuantityGroup) {

      if (modifier.quantity < modifier.MaxQuantity) {
        modifier.Selected = true;
        modifier.quantity++;
        modifierItemList.quantity += -changedQuantity;
      }
      if (modifierItemList.quantity === 0) {
        modifierItemList.Selected = false;
      }
    }
  }

  public bucketStandard(changedQuantity: number, modifier: DotButton, getQuantityButtons, classicModifierList) {
    this._classicModifiers = classicModifierList.Buttons;
    this._maxQuantityGroup = classicModifierList.PageInfo.MaxQuantity;
    this.classicModifiers.forEach((value: DotButton) => {
      if (!value.MinQuantity) {
        value.MinQuantity = 0;
      }
      if (modifier.Link === value.Link && changedQuantity < 0) {
        modifier.quantity--;
        if (modifier.quantity === 0) {
          modifier.Selected = false;
        }
        return;
      }
      if (modifier.Link === value.Link && getQuantityButtons < this.maxQuantityGroup && modifier.quantity < modifier.MaxQuantity) {
        if (changedQuantity > 0) {
          modifier.Selected = true;
        }
        modifier.quantity++;
      }
      if (modifier.Link !== value.Link && value.quantity > value.MinQuantity && getQuantityButtons >= this.maxQuantityGroup && changedQuantity > 0) {
        if (modifier.quantity < modifier.MaxQuantity) {
          modifier.Selected = true;
          modifier.quantity++;
          value.quantity += -changedQuantity;
        }
        if (value.quantity === 0) {
          value.Selected = false;
        }
      }
    });
  }

  public getChargeThresholdGroup(modifier: DotModifier): number {
    if (!modifier.PageInfo.ChargeThreshold || !Number.isInteger(modifier.PageInfo.ChargeThreshold) || modifier.PageInfo.ChargeThreshold <= 0) {
      return 0;
    }
    const quantifiableQuantities = modifier.Buttons.reduce((acc, button) => {
      if (button.quantity > 0 && (!button.ChargeThreshold || button.ChargeThreshold === 0)) {
        acc += button.quantity;
      } else if (button.quantity > 0) {
        acc += (button.ChargeThreshold <= button.quantity) ? button.ChargeThreshold : button.quantity;
      }
      return acc;
    }, 0);
    return (modifier.PageInfo.ChargeThreshold > quantifiableQuantities) ? modifier.PageInfo.ChargeThreshold - quantifiableQuantities : 0;
  }

  public buttonHasSubgroups(button): boolean {
    return button.ButtonType === DotButtonType.ITEM_PACK_BUTTON;
  }
}
