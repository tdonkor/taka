import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { isAutoPopFeatVisible } from '@dotxix/helpers';
import { DotCdkTranslatePipe } from '@dotxix/pipes';
import { DynamicContentService, ModifiersService } from '@dotxix/services';
import { DotButton, DotButtonType, DotModifier, DotPageInfo } from 'dotsdk';
import { InfoDialogComponent } from '../../components/info-dialog/info-dialog.component';
import { ButtonModifierSubgroupComponent } from '../button-modifier-subgroup/button-modifier-subgroup.component';
@Component({
  selector: 'acr-button-modifier-list',
  templateUrl: './button-modifier-list.component.html',
})
export class ButtonModifierListComponent implements OnInit, AfterViewChecked {
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

  public get isDualModifiers(): boolean {
    return this.modifier?.Buttons.length === 2 && this.maxQuantityGroup === 1;
  }

  public get displayText(): boolean {
    return this.getQuantityButtons >= this.maxQuantityGroup;
  }

  public get groupTitle(): DotPageInfo {
    return this.modifier.PageInfo;
  }

  public get isBucketStandard(): boolean {
    return this.modifier?.Buttons.length === 2;
  }

  public get extraButtons(): DotButton[] {
    return this.modifier?.Buttons.filter((btn) => Number(btn.Price) > 0);
  }

  public get simpleButtons(): DotButton[] {
    return this.modifier?.Buttons.filter((btn) => !btn.Price || Number(btn.Price) === 0);
  }

  public get chargeThresholdGroup(): number {
    return this.modifiersService.getChargeThresholdGroup(this.modifier);
  }

  public get displayModifierButtons() {
    return isAutoPopFeatVisible(this.modifier, this.onOrder, !this.isCombo);
  }
  // @ViewChildren('buttonModifier', { read: ElementRef }) public modifierElements: QueryList<ElementRef>;
  @Input() public modifier: DotModifier;
  public qtyButtons: number;
  public isComplementModifier = false;
  public subgroupModifiers: DotButton;
  public checkedSubgroups: number[] = [];
  @Input() public displayUpsizePrice: boolean;
  @Input() public catalogModifierLabelText?: string;
  @Input() public onOrder = false;
  @Input() public isCombo = false;
  @Input() public isButtonChanged = false;

  constructor(
    public modifiersService: ModifiersService,
    protected cdRef: ChangeDetectorRef,
    protected dynamicContentService: DynamicContentService,
    protected translatePipe: DotCdkTranslatePipe
  ) {}

  public ngOnInit(): void {
    if (this.modifier.modifierTemplate.toLowerCase() === 'complement') {
      this.isComplementModifier = true;
    }
    this.qtyButtons = this.getQuantityButtons;
    this.modifier.PageInfo.MinQuantity = this.modifier.PageInfo.MinQuantity || 0;
    let totalQTy = 0;
    this.modifier.Buttons.filter((btn) => btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON).forEach((x) => {
      totalQTy += x.Page.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.MaxQuantity, 0);
    });
  }
  public selectModifiers(button: DotButton, mod: DotModifier, index: number) {
    if (button.ButtonType === DotButtonType.ITEM_PACK_BUTTON) {
      if (!this.verifySubgroupWasOpened(index)) {
        this.checkedSubgroups.push(index);
      }
      const contentRef = this.dynamicContentService.openContent(ButtonModifierSubgroupComponent, {
        subgroupModifiers: button,
        modifier: this.modifier,
        quantityButtons: this.getQuantityButtons,
      });
    } else {
      this.modifiersService.personalizeButton(button, mod, this.getQuantityButtons);
    }
    if (this.displayText) {
      this.dynamicContentService.openContent(InfoDialogComponent, {
        title: this.translatePipe.transform('73'),
        buttonText: this.translatePipe.transform('24'),
      });
    }
  }
  public ngAfterViewChecked() {
    const changedQuantityButtons = this.getQuantityButtons;
    if (this.qtyButtons !== changedQuantityButtons) {
      this.qtyButtons = changedQuantityButtons;
      this.cdRef.detectChanges();
    }
  }
  public bucketStandard(changedQuantity: number, btn: DotButton, mod: DotModifier) {
    this.modifiersService.bucketStandard(changedQuantity, btn, this.getQuantityButtons, mod);
  }

  public verifySubgroupWasOpened(index: number) {
    return this.checkedSubgroups.some((f) => f === index);
  }
}
