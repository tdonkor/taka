import { DotButton, DotModifier } from 'dotsdk';

import { Injectable } from '@angular/core';
import { ProductStatus } from '@dotxix/models';

export interface AutoCompleteButton {
  buttonLink: string;
  minQuantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class ButtonDetailsService {
  private button: DotButton;
  private modifiers: DotModifier[];

  constructor() {}

  public init(button: DotButton) {
    this.button = button;
    this.modifiers = this.button.hasModifiers ? this.button.ModifiersPage.Modifiers : [];
  }

  public setModifiersIncludedQuantity() {
    this.modifiers.forEach((modifier) => {
      if (Number.isInteger(modifier.PageInfo.MaxQuantity) && modifier.PageInfo.MaxQuantity > 0) {
        const sumIncludedQuantities = modifier.Buttons.reduce((acc, btn) => {
          acc += btn.IncludedQuantity ? btn.IncludedQuantity : 0;
          return acc;
        }, 0);
        if (sumIncludedQuantities <= modifier.PageInfo.MaxQuantity) {
          modifier.Buttons.forEach((btn) => {
            // added condition for IncludedQuantity !==0 on both complement pairs
            btn.IncludedQuantity = btn.IncludedQuantity ? btn.IncludedQuantity : 0;
            if (btn.ComplementId && sumIncludedQuantities > btn.IncludedQuantity) {
              btn.IncludedQuantity = 0;
            }
            if (
              Number.isInteger(btn.MinQuantity) &&
              btn.MinQuantity > 0 &&
              Number.isInteger(btn.IncludedQuantity) &&
              btn.IncludedQuantity === 0
            ) {
              btn.quantity = btn.MinQuantity;
              btn.Selected = true;
            }
            if (
              Number.isInteger(btn.IncludedQuantity) &&
              btn.IncludedQuantity > 0 &&
              Number.isInteger(btn.MaxQuantity) &&
              btn.MaxQuantity > 0
            ) {
              if (Number.isInteger(btn.MinQuantity) && btn.IncludedQuantity < btn.MinQuantity) {
                btn.IncludedQuantity = btn.MinQuantity;
              }
              if (btn.IncludedQuantity > btn.MaxQuantity) {
                btn.IncludedQuantity = btn.MaxQuantity;
              }
              if (
                Number(btn.ButtonStatus) === ProductStatus.UNAVAILABLE &&
                Number.isInteger(btn.IncludedQuantity) &&
                btn.IncludedQuantity > 0
              ) {
                btn.IncludedQuantity = 0;
                btn.Selected = false;
              }
              btn.Selected = true;
              btn.quantity = btn.IncludedQuantity;
            }
          });
        }
      }
    });
  }

  public addAutoCompleteModifiers() {
    if (!this.button.hasModifiers) {
      return;
    }
    for (const modifier of this.modifiers) {
      const modifiersSelectedQuantity = modifier.selectedButtons.reduce((acc, mod) => {
        acc += mod.quantity;
        return acc;
      }, 0);
      const autoCompleteModifierButton = modifier.Buttons.find((y) => y.AutoComplete === 1);
      if (
        autoCompleteModifierButton &&
        modifier.PageInfo.MinQuantity > modifiersSelectedQuantity &&
        (!autoCompleteModifierButton.ComplementId ||
          (!this.hasComplementModifierSelected(autoCompleteModifierButton.ComplementId) && modifier.PageInfo.MinQuantity))
      ) {
        const modifierButton = modifier.Buttons.find((buttonModifier) => buttonModifier.Link === autoCompleteModifierButton.Link);
        if (modifierButton) {
          modifierButton.Selected = true;
          modifierButton.quantity += modifier.PageInfo.MinQuantity - modifiersSelectedQuantity;
        }
      }
    }
  }

  private hasComplementModifierSelected(complementId: number): boolean {
    for (const modifier of this.modifiers) {
      if (modifier.Buttons.some((buttonModifier) => Number(buttonModifier.Link) === complementId && buttonModifier.Selected)) {
        return true;
      }
    }
    return false;
  }
}
