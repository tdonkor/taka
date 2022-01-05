import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DotButton, DotButtonType, calculateButtonPrice } from 'dotsdk';
import { PrefixID, ProductStatus } from '@dotxix/models';

import { Subscription } from 'rxjs';
import { AllergensService, ApplicationSettingsService, DynamicContentService, SessionService } from '@dotxix/services';
import { DotCdkTranslatePipe } from '@dotxix/pipes';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'acr-button-modifier',
  templateUrl: './button-modifier.component.html',
})
export class ButtonModifierComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() public modifierButton: DotButton;
  @Input() public maxQuantityGroup: number;
  @Input() public minQuantityGroup: number;
  @Input() public getQuantityButtons: number;
  @Input() public displayUpsizePrice: boolean;
  @Input() public isBucketStandard = false;
  @Input() public isComplementButton = false;
  @Input() public chargeThresholdGroup: number;
  @Output() public selectedModifiers: EventEmitter<any> = new EventEmitter();
  @Output() public quantityChanged: EventEmitter<any> = new EventEmitter();
  @Input() public customPrice: number;
  @Input() public unavailableButton = false;
  @Input() public maxQuantityExists = true;
  @Input() public basketExceededMaxQty: boolean;
  @Input() public isBasketButtonWithoutMaxQty: boolean;
  @Input() public showCounterEdit = true;
  @Input() public isDisabled = false;
  @Input() public isButtonChanged = false;
  @Input() public isSubgroupChecked = false;
  public _prefixQuantity: number;
  public subscriptions: Subscription[] = [];
  public get minQuantity(): number {
    return this.modifierButton.MinQuantity ? this.modifierButton.MinQuantity : 0;
  }

  public get maxQuantity(): number {
    if (!this.maxQuantityGroup) {
      return this.modifierButton.MaxQuantity;
    }
    return this.modifierButton.MaxQuantity >= this.maxQuantityGroup ? this.maxQuantityGroup : this.modifierButton.MaxQuantity;
  }

  public get isButtonStatusUnavailable() {
    return Number(this.modifierButton.ButtonStatus) === ProductStatus.UNAVAILABLE || this.unavailableButton;
  }

  public get isUnavailableButton(): boolean {
    return this.unavailableButton;
  }

  public get quantity(): number {
    return this.modifierButton.quantity;
  }

  public get isSelected(): boolean {
    return (this.modifierButton.Selected && this.modifierButton.quantity > 0) || (this.hasPrefixes && this.prefixQuantity !== 0);
  }

  // public get isDisabled(): boolean {
  //   return this.getQuantityButtons >= this.maxQuantityGroup;
  // }
  public get calculatePrice(): number {
    if (this.modifierButton.DefaultQuantity < this.modifierButton.quantity) {
      return this.quantityAdded * this.price;
    }
  }

  public get displayPrice(): number {
    return this.hasDefaultQuantity && this.calculatePrice >= 0 ? this.calculatePrice : this.price;
  }

  public get price(): number {
    if (this.hasChargeThreshold()) {
      return 0;
    }
    if (Number.isInteger(this.customPrice)) {
      return this.customPrice;
    }
    // return Number(this.modifierButton.Price);
    return calculateButtonPrice(this.modifierButton, this.sessionService.serviceType);
  }
  public get prefixQuantity(): number {
    return this._prefixQuantity;
  }

  public get isButtonSelected() {
    return this.modifierButton.quantity === 0 ? (this.modifierButton.Selected = false) : (this.modifierButton.Selected = true);
  }

  public get hasPrefixes(): boolean {
    return this.modifierButton.HasPrefixes && this.modifierButton.Included;
  }
  public get showPrice() {
    if (this.hasPrefixes && this.prefixQuantity === 2) {
      return true;
    } else if (!this.hasPrefixes && this.price > 0) {
      return true;
    } else {
      return false;
    }
  }

  public get changeQuantity() {
    if (this.prefixQuantity === 1) {
      this.modifierButton.quantity = 0;
    }
    return this.modifierButton;
  }

  public get showButtonCounterEdit(): boolean {
    if (!this.showCounterEdit) {
      return this.showCounterEdit;
    }
    return (
      this.maxQuantity > 1 || this.hasPrefixes || !this.maxQuantityExists || this.basketExceededMaxQty || this.isBasketButtonWithoutMaxQty
    );
  }

  public get quantityAdded() {
    if (this.modifierButton.DefaultQuantity < this.modifierButton.quantity) {
      return this.modifierButton.quantity - this.modifierButton.DefaultQuantity;
    } else {
      return this.modifierButton.DefaultQuantity - this.modifierButton.quantity;
    }
  }

  public get defaultQuantityLabel() {
    if (this.modifierButton.DefaultQuantity === this.modifierButton.quantity) {
      return;
    }
    if (this.modifierButton.DefaultQuantity < this.modifierButton.quantity) {
      return this.calculatePrice > 0
        ? `${this.quantityAdded} ${this.translatePipe.transform('2021060202')} ${this.translatePipe.transform('2021051001')}`
        : `${this.quantityAdded} ${this.translatePipe.transform('2021060202')}`;
    } else {
      if (this.modifierButton.DefaultQuantity > this.modifierButton.quantity && this.quantity > 0) {
        return `${this.translatePipe.transform('2021060203')} ${this.quantityAdded} `;
      } else if (this.quantity === 0) {
        return `${this.translatePipe.transform('2021060201')}`;
      }
    }
  }

  public get hasDefaultQuantity(): boolean {
    return (
      this.modifierButton.DefaultQuantity &&
      this.modifierButton.DefaultQuantity > 0 &&
      this.modifierButton.DefaultQuantity <= this.modifierButton.MaxQuantity
    );
  }

  public get hasSubgroupsModifiers(): boolean {
    return this.modifierButton.ButtonType === DotButtonType.ITEM_PACK_BUTTON;
  }

  // public get subGroupsModifiers(): DotButton[] {
  //   return this.hasSubgroupsModifiers ? this.modifierButton?.Page.Buttons : [];
  // }

  // public get subGroupToggle(): boolean {
  //   return this._subGroupToggle;
  // }

  public get isChecked() {
    const isSubGroupBtnSelected = this.modifierButton.Page.Buttons.some((x) => x.Selected);
    return (this.isSubgroupChecked && isSubGroupBtnSelected) || isSubGroupBtnSelected;
  }
  constructor(
    protected sessionService: SessionService,
    protected allergenService: AllergensService,
    protected dynamicContentService: DynamicContentService,
    protected translatePipe: DotCdkTranslatePipe,
    protected cdr: ChangeDetectorRef,
    protected appSettings: ApplicationSettingsService
  ) {}

  public ngOnInit(): void {
    this.modifierButton.quantity = this.modifierButton.quantity ? this.modifierButton.quantity : 0;
    this.modifierButton.MinQuantity = this.modifierButton.MinQuantity ? this.modifierButton.MinQuantity : 0;
    this.modifierButton.IncludedQuantity = this.modifierButton.IncludedQuantity ? this.modifierButton.IncludedQuantity : 0;
    if (this.hasPrefixes) {
      if (this.modifierButton.selectedPrefixId === PrefixID.ADD_EXTRA) {
        this._prefixQuantity = 2;
      } else if (this.modifierButton.selectedPrefixId === PrefixID.REMOVE) {
        this._prefixQuantity = 0;
      } else if (!this.modifierButton.selectedPrefixId) {
        this.modifierButton.quantity = 0;
        this._prefixQuantity = 1;
      }
    }
    this.modifierButton.quantity =
      this.modifierButton.MinQuantity > 0 && this.modifierButton.quantity < this.modifierButton.MinQuantity
        ? this.modifierButton.MinQuantity
        : this.modifierButton.quantity;
    // (this.modifierButton.quantity === 0 && !this.isButtonChanged ) ? this.modifierButton.Selected = false : this.modifierButton.Selected = true;
    this.selectedDefaultModifier();
    this.selectedDefaultQuantity();
    this.setRemoveModifier();
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  public selectModifiers(modifier: DotButton) {
    if (
      !modifier.Selected &&
      modifier?.AllergensAndNutritionalValues?.Allergens.some((a) =>
        this.allergenService.selectedAllergens.some((allergen) => a.Name.includes(allergen.Name))
      )
    ) {
      const hasFullAllergen = modifier?.AllergensAndNutritionalValues?.Allergens.some((a) =>
        this.allergenService.selectedAllergens.some((allergen) => a.Name.includes(allergen.Name) && !a.Name.includes('_m'))
      );
      const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
        title: hasFullAllergen ? this.translatePipe.transform('39') : this.translatePipe.transform('2021012601'),
        leftButtonText: this.translatePipe.transform('23'),
        rightButtonText: this.translatePipe.transform('28'),
      });
      this.subscriptions.push(
        contentRef.afterClosed.subscribe((response) => {
          if (response === 'Yes') {
            this.selectedModifiers.emit(modifier);
          }
        })
      );
    } else {
      if (this.hasDefaultQuantity) {
        if (modifier.DefaultQuantity === 1 && modifier.MaxQuantity === 1 && modifier.MinQuantity === 0 && modifier.quantity !== 0) {
          this.decreaseaQuantityWithDefaultQty();
        } else {
          this.increaseQuantityWithDefaultQty();
        }
      }
      if (this.hasPrefixes) {
        this.increaseQuantityWithPrefixes(1, modifier);
      } else if (!this.hasDefaultQuantity) {
        this.selectedModifiers.emit(modifier);
      }
    }
    this.setRemoveModifier();
  }

  public onQuantityUpdate(count: 1 | -1): void {
    if (!this.isBucketStandard && !this.isComplementButton && !this.modifierButton.hasCombos && !this.modifierButton.hasModifiers) {
      if (!this.hasPrefixes && !this.hasDefaultQuantity) {
        if (count > 0 && this.getQuantityButtons < this.maxQuantityGroup) {
          this.modifierButton.Selected = true;
          this.modifierButton.quantity++;
        } else if (count > 0 && this.getQuantityButtons >= 0 && !this.maxQuantityGroup) {
          this.modifierButton.Selected = true;
          this.modifierButton.quantity++;
        } else if (count > 0 && this.basketExceededMaxQty) {
          this.modifierButton.Selected = true;
          this.modifierButton.quantity++;
        } else if (count < 0) {
          this.modifierButton.quantity--;
          if (this.modifierButton.quantity === 0) {
            this.modifierButton.Selected = false;
          }
        }
      }
      if (this.hasDefaultQuantity) {
        if (count > 0) {
          this.increaseQuantityWithDefaultQty();
        } else {
          this.decreaseaQuantityWithDefaultQty();
        }
      }
      if (this.hasPrefixes) {
        if (count > 0) {
          this.increaseQuantityWithPrefixes(count, this.modifierButton);
        }
        if (count < 0) {
          this.decreaseQuantityWithPrefixes(this.modifierButton);
        }
      }
    } else {
      this.quantityChanged.emit(count);
    }
    this.setRemoveModifier();
  }

  public selectedDefaultModifier() {
    if (this.modifierButton.MinQuantity >= 1 && !this.hasPrefixes) {
      this.modifierButton.Selected = true;
    }
  }
  public increaseQuantityWithDefaultQty() {
    if (this.modifierButton.quantity === 0) {
      this.modifierButton.quantity = this.modifierButton.DefaultQuantity;
      this.modifierButton.Selected = true;
    } else if (
      this.modifierButton.quantity > 0 &&
      this.getQuantityButtons < this.maxQuantityGroup &&
      this.modifierButton.quantity < this.modifierButton.MaxQuantity
    ) {
      this.modifierButton.Selected = true;
      this.modifierButton.quantity++;
    }
    // if (this.modifierButton.DefaultQuantity && this.modifierButton.DefaultQuantity > 0) {
    //   this.modifierButton.removeItem = this.modifierButton.quantity <= 0;
    // }
    this.setRemoveModifier();
  }

  public decreaseaQuantityWithDefaultQty() {
    this.modifierButton.quantity--;
    this.setRemoveModifier();
  }

  public increaseQuantityWithPrefixes(count: number, button: DotButton) {
    if (count > 0 && this.prefixQuantity === 1) {
      button.quantity = 1;
      button.Selected = true;
      button.selectedPrefixId = PrefixID.ADD_EXTRA;
      this._prefixQuantity++;
    }
    if (count > 0 && this.prefixQuantity === 0) {
      this._prefixQuantity++;
      button.quantity = 0;
      button.Selected = false;
      delete button['selectedPrefixId'];
    }
  }

  public decreaseQuantityWithPrefixes(button: DotButton) {
    if (this.prefixQuantity === 2) {
      this._prefixQuantity--;
      if (this._prefixQuantity === 1) {
        button.quantity = 0;
        button.Selected = false;
        delete button['selectedPrefixId'];
      }
    } else if (this.prefixQuantity === 1) {
      button.quantity = 1;
      button.Selected = true;
      button.selectedPrefixId = PrefixID.REMOVE;
      this._prefixQuantity--;
    }
  }

  public selectedDefaultQuantity() {
    if (
      this.hasDefaultQuantity &&
      (this.modifierButton.quantity === null || this.modifierButton.quantity === undefined) &&
      this.modifierButton.MinQuantity <= this.modifierButton.DefaultQuantity
    ) {
      this.modifierButton.Selected = true;
      this.modifierButton.quantity = this.modifierButton.DefaultQuantity;
    }
  }
  // public selectItemsGroupModifier() {
  //   if (this.hasSubgroupsModifiers) {
  //     this._subGroupToggle = !this._subGroupToggle;
  //   }
  // }

  public hasChargeThreshold(): boolean {
    if (!this.modifierButton.ChargeThreshold || this.modifierButton.ChargeThreshold <= this.modifierButton.quantity) {
      return false;
    }
    return true;
  }

  private setRemoveModifier() {
    this.modifierButton.removeItem = !!(
      this.modifierButton.DefaultQuantity &&
      this.modifierButton.DefaultQuantity > 0 &&
      this.modifierButton.quantity <= 0 &&
      this.appSettings.sendModifiersWithZeroQuantity
    );
  }
}
