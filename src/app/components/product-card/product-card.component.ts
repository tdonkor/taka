import * as _ from 'lodash';

import {
  ApplicationSettingsService,
  BasketService,
  DynamicContentService,
  PromosService,
  SessionService,
  TranslationsService,
} from '@dotxix/services';
import {
  CatalogPicturePipe,
  CurrencyPipe,
  DotCdkTranslateCaptionPipe,
  DotCdkTranslatePipe,
  TranslateCatalogTitle,
  TranslatePicturePipe,
} from '@dotxix/pipes';
import { ComboStepType, DotButton, DotButtonType, DotPrefixes, DotPrefixesLoader, calculateButtonPrice, getCombosCatalogButton } from 'dotsdk';
import { PrefixID } from '@dotxix/models';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';

import { BasketComponent } from '../basket/basket.component';
import { ButtonDetailsComponent } from '../button-details/button-details.component';
import { ComboStepperComponent } from '../combo-stepper/combo-stepper.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { isAutoPopFeatVisible } from '@dotxix/helpers';

@Component({
  selector: 'acr-product-card',
  templateUrl: './product-card.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [DotCdkTranslateCaptionPipe, CurrencyPipe],
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() public basketButton: DotButton;
  @Output() public quantityUpdate: EventEmitter<any> = new EventEmitter();
  @Output() public productRemoved: EventEmitter<any> = new EventEmitter();
  public selectedModifiersButtons: DotButton[] = [];
  public subscriptions: Subscription[] = [];

  public get displayButton(): boolean {
    if (this.basketButton.hasCombos) {
      return true;
    }
    return this.basketButton.ModifiersPage.Modifiers.filter((x) => isAutoPopFeatVisible(x, false, true)).length > 0;
  }

  public get price(): number {
    const quantityCalculated = this.appSettingsService.quantityCalculated;
    const basketButtonPrice = this.buttonPrice(this.basketButton);

    if (this.isLinkToParent) {
      return this.childButtons.reduce(
        (acc, button) => acc + this.buttonPrice(button) * button.quantity,
        basketButtonPrice * this.basketButton.quantity
      );
    } else {
      return quantityCalculated ? basketButtonPrice * this.basketButton.quantity : basketButtonPrice;
    }
  }

  public get formattedPrice(): string {
    return this.basketButton['$$OrderDiscount'] ? this.basketButton.Price : this.dotCurrencyPipe.transform(this.price * this.quantity);
  }

  public get quantity(): number {
    return this.basketButton.quantity;
  }

  public get extraItems(): DotButton[] {
    const selectedButton = [];
    if (this.basketButton.hasModifiers) {
      this.basketButton.ModifiersPage.Modifiers.forEach((modifier) => {
        modifier.Buttons.forEach((btn: DotButton) => {
          this.selectModifiersSubgroup(btn, selectedButton);
          if (btn.ButtonType !== DotButtonType.ITEM_PACK_BUTTON) {
            selectedButton.push(btn);
          }
        });
      });
    }
    // add subgroup items from a combo in basket
    if (this.basketButton.hasCombos) {
      this.selectedComboSubgroup(this.comboSelectedButtons, selectedButton);
      if (selectedButton.length > 0) {
        return this.comboSelectedButtons.filter((btn) => btn.ButtonType !== DotButtonType.ITEM_PACK_BUTTON).concat(selectedButton);
      } else {
        return this.comboSelectedButtons.filter((btn) => btn.ButtonType !== DotButtonType.ITEM_PACK_BUTTON);
      }
    }
    return selectedButton;
  }
  public get skipPrecalculate(): boolean {
    return this.router.url === '/cod-view' && !this.appSettingsService.skipPrecalculate ? false : true;
  }

  public get parentButton(): DotButton {
    return getCombosCatalogButton(this.basketButton.ComboPage.ID.toString());
  }

  public get subtitle(): string {
    const upsizeButton = this.basketButton?.ComboPage?.Combos.find(
      (combo) => combo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase()
    )?.Buttons.find((btn) => btn.Selected);
    return this.dotTranslateCaption.transform(upsizeButton) ?? '';
  }

  public get productTitle(): string {
    return this.basketButton.hasCombos ? this.subtitle : this.buttonTranslate(this.basketButton);
  }

  public get comboSelectedButtons(): DotButton[] {
    return this.basketButton.ComboPage.Combos.filter(
      (combo) => combo.Visible && combo.ComboStepType.toLowerCase() === ComboStepType.ComboStep.toLowerCase()
    ).reduce((acc, c) => {
      const firstSelectedButton = c.Buttons.find((btn) => btn.Selected && btn.Visibility !== '255');
      if (firstSelectedButton) {
        acc.push(firstSelectedButton);
      }
      return acc;
    }, [] as DotButton[]);
  }

  public get buttonPicture(): string {
    if (this.basketButton.hasCombos) {
      return this.translatePicturePipe.transform(this.parentButton);
    }

    const translateCatalog = this.translateCatalogTitle.transform(this.basketButton);
    if (this.basketButton.hasModifiers && translateCatalog) {
      return this.translateCatalogPicturePipe.transform(this.basketButton);
    }

    return this.translatePicturePipe.transform(this.basketButton);
  }

  public get isLinkToParent(): boolean {
    return this.childButtons.length > 0;
  }

  public get childButtons(): DotButton[] {
    return this.basketButton['promoChildButtons']
      ? this.basketButton['promoChildButtons']
      : this.basketService.buttons.filter(
          (b) => this.basketButton['parentLinkUUID'] && b['childLinkUUID'] === this.basketButton['parentLinkUUID']
        );
  }

  public get hasExtraItems(): boolean {
    return this.basketButton.hasModifiers || this.basketButton.hasCombos;
  }

  constructor(
    protected dynamicContentService: DynamicContentService,
    protected translationsService: TranslationsService,
    protected dotTranslatePipe: DotCdkTranslatePipe,
    protected dotTranslateCaption: DotCdkTranslateCaptionPipe,
    protected basketService: BasketService,
    protected appSettingsService: ApplicationSettingsService,
    protected router: Router,
    protected sessionService: SessionService,
    protected translatePicturePipe: TranslatePicturePipe,
    protected translateCatalogPicturePipe: CatalogPicturePipe,
    protected translateCatalogTitle: TranslateCatalogTitle,
    protected dotCurrencyPipe: CurrencyPipe,
    protected promosService: PromosService
  ) {}

  public ngOnInit(): void {}

  public ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
  public selectModifiersSubgroup(button, selectedButton) {
    const subgroupItems = button.Page?.Buttons?.filter((b) => b.Selected);
    if (button.ButtonType === DotButtonType.ITEM_PACK_BUTTON && subgroupItems.length > 0) {
      subgroupItems.forEach((selctedBtn) => {
        selectedButton.push(selctedBtn);
      });
    }
  }
  public selectedComboSubgroup(button, selectedButton) {
    const subgroupItems = button.filter((btn) => btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON && btn.Selected);
    if (subgroupItems.length > 0) {
      subgroupItems.forEach((selectedBtn) => {
        selectedBtn.Page.Buttons.filter((b) => selectedButton.push(b));
      });
    }
  }
  public quantityAdded(button: DotButton) {
    if (button.DefaultQuantity < button.quantity) {
      return button.quantity - button.DefaultQuantity;
    } else {
      return button.DefaultQuantity - button.quantity;
    }
  }

  public hasDefaultQuantity(button: DotButton) {
    return button.DefaultQuantity && button.DefaultQuantity > 0 && button.DefaultQuantity <= button.MaxQuantity;
  }
  public defaultQuantityLabel(button: DotButton) {
    if (button.DefaultQuantity === button.quantity) {
      return '';
    }
    if (button.DefaultQuantity < button.quantity) {
      return `${this.dotTranslatePipe.transform('2021050702')} ${this.quantityAdded(button)} ${this.dotTranslateCaption.transform(button)}`;
    } else {
      if (button.DefaultQuantity > button.quantity && button.quantity > 0) {
        return `${this.dotTranslatePipe.transform('2021060203')} ${this.dotTranslateCaption.transform(button)}`;
      } else if (button.quantity === 0) {
        return `${this.dotTranslatePipe.transform('2021060201')} ${this.dotTranslateCaption.transform(button)}`;
      }
    }
  }

  public buttonPrice(button: DotButton): number {
    return calculateButtonPrice(button, this.sessionService.serviceType);
  }

  public onQuantityUpdate(count: 1 | -1): void {
    if (count > 0) {
      this.basketService.addButtonToBasket(this.basketButton, true);
    } else if (this.appSettingsService.productRemovalWarning && this.basketButton.quantity <= 1) {
      const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
        title: this.replaceCaption(this.basketButton),
        leftButtonText: this.dotTranslatePipe.transform('23'),
        rightButtonText: this.dotTranslatePipe.transform('71'),
      });
      this.subscriptions.push(
        contentRef.afterClosed.subscribe((response) => {
          if (response === 'Yes') {
            this.basketService.removeButtonFromBasket(this.basketButton);
            if (this.basketService.buttons.length <= 0) {
              this.basketService.basketToggle(BasketComponent);
            }
            this.productRemoved.emit();
            return;
          }
        })
      );
    } else {
      this.basketService.removeButtonFromBasket(this.basketButton);
      if (this.basketService.buttons.length <= 0) {
        this.basketService.basketToggle(BasketComponent);
      }
    }

    this.quantityUpdate.emit();
  }

  public changeProduct(button: DotButton): void {
    button.isChanged = true;
    if (button.hasModifiers) {
      this.dynamicContentService.openContent(ButtonDetailsComponent, { btn: button });
    }

    if (button.hasCombos) {
      this.dynamicContentService.openContent(ComboStepperComponent, { btn: button });
    }
  }

  public getProductNameWithPrefixes(button: DotButton) {
    if (button.selectedPrefixId) {
      const prefixes: DotPrefixes[] = DotPrefixesLoader.getInstance().loadedModel;
      if (button.selectedPrefixId === PrefixID.REMOVE) {
        return prefixes.find((x) => x.Id === PrefixID.REMOVE);
      } else if (button.selectedPrefixId === PrefixID.ADD_EXTRA) {
        return prefixes.find((x) => x.Id === PrefixID.ADD_EXTRA);
      }
    }
  }
  public getSelectedComboModifiers(button: DotButton): string {
    const data = [];
    button?.ModifiersPage?.Modifiers.forEach((modifier) => {
      modifier.selectedButtons.forEach((selectedBtn) => {
        const productName = this.dotTranslateCaption.transform(selectedBtn);
        if (selectedBtn.quantity > 1 && !selectedBtn.DefaultQuantity) {
          const text = `${selectedBtn.quantity} x ${productName}`;
          data.push(text);
        }
        if (selectedBtn.quantity === 1 && !selectedBtn.DefaultQuantity) {
          data.push(productName);
        }
        if (selectedBtn.DefaultQuantity > 0 && this.defaultQuantityLabel(selectedBtn)?.length > 0) {
          data.push(this.defaultQuantityLabel(selectedBtn));
        }
      });
    });

    return data.join(', ');
  }

  public displayChildChange(child: DotButton): boolean {
    return (
      child.isPromo &&
      this.skipPrecalculate &&
      (child.hasCombos || child?.ModifiersPage?.Modifiers?.filter((x) => isAutoPopFeatVisible(x, false, true)).length > 0)
    );
  }

  public buttonTranslate(button: DotButton): string {
    if (button.hasCombos) {
      const title = this.translationsService.getTranslatedButtonCaption(this.parentButton);
      if (title === null) {
        return this.translationsService.getTranslatedButtonCaption(button);
      }
      return `${title} ${this.subtitle}`;
    }

    const translateCatalog = this.translateCatalogTitle.transform(button);
    if (button.hasModifiers && translateCatalog) {
      return translateCatalog;
    }

    return this.translationsService.getTranslatedButtonCaption(button);
  }

  public getChildModifierButtons(childButton: DotButton): DotButton[] {
    return (
      childButton?.ModifiersPage?.Modifiers?.reduce((acc, mod) => {
        mod.Buttons.forEach((btn) => {
          if (btn.Selected) {
            acc.push(btn);
          }
        });
        return acc;
      }, []) || []
    );
  }

  public onRemoveClick(button: DotButton) {
    if (this.appSettingsService.productRemovalWarning) {
      const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
        title: this.replaceCaption(button),
        leftButtonText: this.dotTranslatePipe.transform('32'),
        rightButtonText: this.dotTranslatePipe.transform('33'),
      });
      this.subscriptions.push(
        contentRef.afterClosed.subscribe((response) => {
          if (response === 'Yes') {
            this.removeButton(button);
            if (this.basketService.buttons.length <= 0) {
              this.basketService.basketToggle(BasketComponent);
            }
            this.productRemoved.emit();
            return;
          }
        })
      );
    } else {
      this.removeButton(button);
    }
  }

  private removeButton(button: DotButton) {
    if (button.isPromo && !!button['Promo']) {
      const promoUUID = button['Promo'].UUID;
      if (!!button['$$OrderDiscount']) {
        this.promosService.orderDiscountPromoInfo.clearAppliedOrderDiscountFromElog();
      }
      const index = this.promosService.scannedBarcodes.findIndex((barcode) => barcode.UUID === promoUUID);
      this.promosService.scannedBarcodes.splice(index, 1);

      this.basketService.buttons
        .filter((btn) => btn['Promo']?.UUID === promoUUID)
        .forEach((b) => this.basketService.removeButtonFromBasket(b));
    } else {
      this.basketService.removeButtonFromBasket(button, true);
    }
  }

  private replaceCaption(button: DotButton): string {
    const title = this.dotTranslatePipe.transform('2020122102');
    const caption = this.buttonTranslate(button);

    return title.replace('%PRODUCT_NAME%', caption);
  }
}
