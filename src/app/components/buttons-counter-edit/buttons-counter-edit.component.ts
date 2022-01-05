import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'acr-buttons-counter-edit',
  templateUrl: './buttons-counter-edit.component.html',
  encapsulation: ViewEncapsulation.None
})
export class ButtonsCounterEditComponent implements OnInit {
  @Input() public quantity: number;
  @Input() public price: number;
  @Input() public minQuantity: number;
  @Input() public maxQuantity: number;
  @Input() public displayPrice = true;
  @Input() public hasPrefixes = false;
  @Input() public prefixQuantity = 0;
  @Input() public basketExceededMaxQty = false;
  @Input() public isUnavailableButton = false;
  @Input() public hasDefaultQuantity = false;

  @Output() public quantityUpdate: EventEmitter<number> = new EventEmitter();


  public get disabledIncrementBtn() {
    if (this.quantity >= this.maxQuantity && !this.hasPrefixes && !this.basketExceededMaxQty) {
      return true;
    } else if (this.hasPrefixes && this.prefixQuantity === 2) {
      return true;
    } else if (this.isUnavailableButton) {
      return true;
    } else if (this.basketExceededMaxQty && this.quantity > this.maxQuantity) {
      return false;
    }
    return false;
  }

  public get isButtonDisabled(): boolean {
    if (this.quantity <= this.minQuantity && !this.hasPrefixes) {
      return true;
    } else if (this.hasPrefixes && this.prefixQuantity === 0) {
      return true;
    } else  {
      return false;
    }
  }
  constructor() {}

  public ngOnInit(): void {}

  public changeQuantity(quantity: number): void {
    this.quantityUpdate.emit(quantity);
  }
}


