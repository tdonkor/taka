import { animate, AUTO_STYLE, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ModifiersService } from '@dotxix/services';
import { DotButton, DotModifier } from 'dotsdk';

const DEFAULT_DURATION = 150;

@Component({
  selector: 'acr-collapsible',
  templateUrl: './collapsible.component.html',
  animations: [
    trigger('collapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class CollapsibleComponent implements OnInit {
  @Input() public buttons: DotButton[] = [];
  @Input() public isExtraButton: boolean;
  @Input() public complementModifier: DotModifier;
  @Input() public chargeThresholdGroup: number;
  public collapsed = true;

  public get getQuantityButtons() {
    return this.complementModifier.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
  }

  public get arrowImage() {
    return this.collapsed ? 'down' : 'up';
  }

  constructor(protected modifierService: ModifiersService) {}

  public ngOnInit(): void {
    if (this.isExtraButton) {
      this.collapsed = false;
    }
  }

  public toggleCollapsible() {
    this.collapsed = !this.collapsed;
  }

  public selectModifiers(button: DotButton) {
    this.modifierService.personalizeButton(button, this.complementModifier, this.getQuantityButtons);
    this.changeComplementButton(button);
  }

  public quantityChanged(button: DotButton, changedQuantity?: number) {
    if (changedQuantity > 0 && this.getQuantityButtons < this.complementModifier.PageInfo.MaxQuantity) {
      button.Selected = true;
      button.quantity++;
    } else if (changedQuantity < 0) {
      if (button.quantity > 0) {
        button.quantity--;
        if (button.quantity === 0) {
          button.Selected = false;
        }
      }
    }
    this.changeComplementButton(button);
  }

  public changeComplementButton(button: DotButton) {
    this.complementModifier.Buttons.forEach((btn) => {
      if (Number(btn.Link) === button.ComplementId && btn.Selected) {
        if (this.getQuantityButtons <= this.complementModifier.PageInfo.MaxQuantity) {
          button.Selected = true;
          button.quantity = 1;
          btn.Selected = false;
          btn.quantity = 0;
        }
      }
    });
  }
}
