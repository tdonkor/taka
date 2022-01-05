import { Component, OnInit } from '@angular/core';
import { Animations } from '@dotxix/animation';
import { AbstractDynamicComponent, DynamicContentParams, DynamicContentRef, ModifiersService } from '@dotxix/services';
import { DotButton, DotButtonType, DotModifier } from 'dotsdk';

@Component({
  selector: 'acr-button-modifier-subgroup',
  templateUrl: './button-modifier-subgroup.component.html',
  styleUrls: ['./button-modifier-subgroup.component.scss'],
  animations: [Animations.popupIn, Animations.popupOut],
})
export class ButtonModifierSubgroupComponent extends AbstractDynamicComponent implements OnInit {
  public subgroupModifiers: DotButton;
  public modifier: DotModifier;
  public quantityButtons: number;

  constructor(private data: DynamicContentParams, private dynamicContentRef: DynamicContentRef, public modifiersService: ModifiersService) {
    super();
  }

  public get getQuantityButtons() {
    let totalQty = 0;
    this.modifier.Buttons.filter((btn) => btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON).forEach((x) => {
      totalQty += x.Page.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
    });
    totalQty += this.modifier.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
    return totalQty;
  }

  public get maxQuantityGroup(): number {
    return this.modifier.PageInfo.MaxQuantity;
  }
  public get displayText(): boolean {
    return this.getQuantityButtons >= this.maxQuantityGroup;
  }

  public ngOnInit(): void {
    this.subgroupModifiers = this.data.subgroupModifiers;
    this.modifier = this.data.modifier;
    this.quantityButtons = this.data.quantityButtons;
  }

  public selectModifiers(button: DotButton, mod: DotModifier) {
    if (this.subgroupModifiers?.Page.Buttons.length > 0 && this.subgroupModifiers.Page.Buttons.some((btn) => btn.Link === button.Link)) {
      this.modifiersService.personalizeButton(button, mod, this.getQuantityButtons, this.subgroupModifiers.Page.Buttons);
    }
  }

  public close() {
    this.dynamicContentRef.close(this.subgroupModifiers);
  }
}
