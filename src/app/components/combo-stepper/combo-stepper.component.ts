import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  DotButton,
  DotCombo,
  calculateButtonPrice,
  PosServingLocation,
  DotModifier,
  DotSuggestionSalesService,
  DotButtonType,
  ComboStepType,
  generateUUID,
  getCombosCatalogButton,
} from 'dotsdk';
import * as _ from 'lodash';
import { ProductStatus, PromoDiscountsMode, Suggestion } from '@dotxix/models';
import {
  AbstractDynamicComponent,
  ApplicationSettingsService,
  BasketService,
  ComboStepperService,
  DynamicContentParams,
  DynamicContentRef,
  DynamicContentService,
  SessionService,
} from '@dotxix/services';
import { enabledTouchlessMode, getTouchlessClass, isAdaEnabled, isAutoPopFeatVisible, log } from '@dotxix/helpers';
import { ComboModifierLabelTranslationPipe, DotCdkTranslateCaptionPipe, DotCdkTranslatePipe } from '@dotxix/pipes';
import { Animations } from '@dotxix/animation';
import { BasketComponent } from '../basket/basket.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

enum ComboStepState {
  CHOOSE = 'choose',
  CUSTOMIZE = 'customize',
  SUBGROUP = 'subgroup',
}

@Component({
  selector: 'acr-combo-stepper',
  templateUrl: './combo-stepper.component.html',
  providers: [DotCdkTranslateCaptionPipe],
  encapsulation: ViewEncapsulation.None,
  animations: [Animations.popupIn, Animations.popupOut],
})
export class ComboStepperComponent extends AbstractDynamicComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  @ViewChild('modifierMessagesTpl') public modifierMessagesTpl: ElementRef;
  public enabledTouchlessMode = enabledTouchlessMode;
  public isAdaEnabled = isAdaEnabled;
  public getTouchlessClass = getTouchlessClass;
  public button: DotButton;
  public currentComboStepButton: DotButton;
  public currentSize: string;
  public initialSize: string;
  public interfaceCombos: DotCombo[] = [];
  public currentComboStepIndex = 0;
  public currentComboStepState: ComboStepState;
  public ComboStepState = ComboStepState;
  public exitAnimation = false;
  public comboModifierLabelText?: string;
  public subscriptions: Subscription[] = [];
  public filteredComboStepButtons: DotButton[] = [];
  private _scrollIncrement;

  public get parentButton(): DotButton {
    return getCombosCatalogButton(this.button.ComboPage.ID.toString());
    
  }

  public get comboStepButtons(): DotButton[] {
    if (this.interfaceCombos[this.currentComboStepIndex].ComboStepType.toLocaleLowerCase() === ComboStepType.ComboUpSize.toLowerCase()) {
      return this.interfaceCombos[this.currentComboStepIndex].Buttons.filter(
        (btn) => Math.abs(Number(btn.Link)) >= Math.abs(Number(this.initialSize)) && this.checkSizeHasReplacings(btn.Link)
      );
    }
    return this.interfaceCombos[this.currentComboStepIndex].Buttons.filter(
      (btn) => btn.VisibleOn === this.currentSize || (btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON && btn.Page?.Buttons?.length > 0)
    );
  }

  public get currentCombo(): DotCombo {
    return this.interfaceCombos[this.currentComboStepIndex];
  }

  public get selectedComboStep(): DotButton[] {
    return this.currentCombo.Buttons.filter((x) => x.Selected);
  }

  public get subtitle(): string {
    const upsizeButton = this.interfaceCombos
      .find((combo) => combo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase())
      ?.Buttons.find((btn) => btn.Link === this.currentSize);
    return upsizeButton ? this.dotTranslateCaption.transform(upsizeButton) : this.dotTranslateCaption.transform(this.button);
  }

  public get isComboUpsize(): boolean {
    return this.currentCombo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase();
  }

  public get headerButtons(): DotButton[] {
    if (this.appSettings.enableComboAnimation) {
      return this.interfaceCombos
        .filter((combo) => combo.ComboStepType.toLowerCase() === ComboStepType.ComboStep.toLowerCase())
        .reduce((acc, c) => {
          const firstSelectedButton = c.Buttons.find((btn) => btn.Selected);
          if (firstSelectedButton) {
            acc.push(firstSelectedButton);
          }
          return acc;
        }, [] as DotButton[]);
    }
    return [this.parentButton];
  }

  public get displayBackButton(): boolean {
    return (this.currentComboStepState === ComboStepState.CUSTOMIZE && this.comboStepButtons.length > 1) || this.currentComboStepIndex > 0;
  }

  public get isLastStep(): boolean {
    return this.currentComboStepIndex === this.interfaceCombos.length - 1;
  }

  public get disableConfirmButton(): boolean {
    let result = false;
    for (const modifier of this.modifiers) {
      const qtyButtons = modifier?.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
      //  disable step confirmation if modifier group MinQty not reached
      if (this.currentComboStepState === ComboStepState.CUSTOMIZE) {
      return result = qtyButtons < modifier.PageInfo.MinQuantity && !this.modifiers.some((x) => x.Buttons.find((y) => y.AutoComplete === 1));
      }
    }
    result =
      (this.currentComboStepState === ComboStepState.CHOOSE || this.currentComboStepState === ComboStepState.SUBGROUP) &&
      this.currentCombo.Buttons?.every((btn) => !btn.Selected || btn.Page?.Buttons?.every((x) => !x.Selected));
    return result;
  }

  public get scrollIncrement(): number {
    return this._scrollIncrement;
  }

  constructor(
    protected dataParams: DynamicContentParams,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected dynamicContentRef: DynamicContentRef,
    protected sessionService: SessionService,
    protected dotTranslateCaption: DotCdkTranslateCaptionPipe,
    protected appSettings: ApplicationSettingsService,
    protected basketService: BasketService,
    protected dynamicContentService: DynamicContentService,
    protected translatePipe: DotCdkTranslatePipe,
    protected translateComboModifierLabelPipe: ComboModifierLabelTranslationPipe,
    protected cdRef: ChangeDetectorRef,
    @Inject('SUGGESTION_COMPONENT')
    protected suggestionComponent: Type<AbstractDynamicComponent>,
    private service: ComboStepperService
  ) {
    super();
    this.service.content = this.dataParams.btn;
  }

  public ngOnInit() {
    this.button = _.cloneDeep(this.dataParams.btn);

    if (typeof this.button['$$forcePriceIn'] !== 'number' && typeof this.button.ForcePriceIN === 'number') {
      this.button['$$forcePriceIn'] = this.button.ForcePriceIN;
    }
    if (typeof this.button['$$forcePriceOut'] !== 'number' && typeof this.button.ForcePriceOUT === 'number') {
      this.button['$$forcePriceOut'] = this.button.ForcePriceOUT;
    }
    log('button: ', this.button);
    this.button.Selected = true;
    this.button.quantity = this.button.quantity || 1;
    this.currentSize = this.button.selectedSize || this.button.StartSize || this.button['DefaultSize'];
    this.initialSize = this.button.StartSize || this.button['DefaultSize'];
    this.button.ComboPage.Combos.forEach((combo) => {
      if (combo.Buttons.every((btn) => btn.Visibility === '255') || !combo.Visible) {
        for (const b of combo.Buttons) {
          if (b.VisibleOn === this.currentSize) {
            b.Selected = true;
            b.quantity = 1;
            break;
          }
        }
      }
      if (
        combo.Visible &&
        (combo.ComboStepType.toLowerCase() !== ComboStepType.ComboStep.toLowerCase() ||
          !combo.Buttons.every((btn) => btn.Visibility === '255'))
      ) {
        this.interfaceCombos.push(combo);
      }
    });
    this.nextStep();
    this.setModifiersIncludedQuantity();
    this.setDefaultQuantity();
    this.checkAutoSelect(this.comboStepButtons);
    this.filterSubgroupButtons(this.button);
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  public ngAfterViewInit() {
    this.verticalScrollIncrement();
  }

  public getUpsizeButtonPrice(newSize: string): number {
    const currentButton = _.cloneDeep(this.button);
    this.replaceItemsOnResize(this.initialSize, currentButton);
    currentButton.selectedSize = this.initialSize;
    const upsizeButton = _.cloneDeep(this.button);
    this.replaceItemsOnResize(newSize, upsizeButton);
    upsizeButton.selectedSize = newSize;
    return (
      calculateButtonPrice(upsizeButton, this.sessionService.serviceType) -
      calculateButtonPrice(currentButton, this.sessionService.serviceType)
    );
  }

  public get modifiers(): DotModifier[] {
    return this.currentComboStepButton?.hasModifiers ? this.currentComboStepButton.ModifiersPage.Modifiers : [];
  }

  // * will move images from list slightly off to left or right with inline styles*//
  public setInlineStyle(index: number, zIndex: number) {
    if (index === 0) {
      return { zIndex };
    }
    const standardPosition = 260;
    // *  reset to lower number when over 7 combos **will work up to 18  * //
    const decreasePosition = standardPosition - (index >= 7 ? Math.round(index / 3) : index) * 40;
    return index % 2 === 0 ? { left: `${decreasePosition}rem`, zIndex } : { right: `${decreasePosition}rem`, zIndex };
  }

  public backClick() {
    this.verticalScrollChange();

    if (this.currentComboStepState === ComboStepState.CHOOSE) {
      const currentCombo = this.isLastStep ? this.interfaceCombos[this.currentComboStepIndex - 1] : this.currentCombo;
      this.currentComboStepIndex--;
      this.currentComboStepButton = currentCombo.Buttons.find((btn) => btn.Selected);

      if (
        this.comboStepButtons.length === 1 &&
        !this.isLastStep &&
        this.comboStepButtons[0]?.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, !this.button.isChanged, false))
      ) {
        this.currentComboStepButton = this.comboStepButtons.find((x) => x.Selected);
        this.currentComboStepState = ComboStepState.CUSTOMIZE;
      }
      if (
        currentCombo.Buttons.filter((btn) => btn.VisibleOn === this.currentSize).length === 1 &&
        currentCombo.Buttons[0]?.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, !this.button.isChanged, false))
      ) {
        this.currentComboStepState = ComboStepState.CUSTOMIZE;
      }
      return;
    }
    this.currentComboStepState = ComboStepState.CHOOSE;
  }
  public cancelClick(): void {
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: this.translatePipe.transform('20210201001'),
      leftButtonText: this.translatePipe.transform('32'),
      rightButtonText: this.translatePipe.transform('33'),
    });

    this.subscriptions.push(
      contentRef.afterClosed.subscribe((response) => {
        if (response === 'Yes') {
          this.exitAnimation = true;
          this.button.Selected = false;
          setTimeout(() => {
            this.dynamicContentRef.close(this.button);
            if (
              this.appSettings.viewBasketAfterProductSelection === true &&
              !this.dataParams.fromSuggestions &&
              this.basketService.buttons &&
              this.basketService.buttons.length > 0
            ) {
              this.basketService.openBasket(BasketComponent);
            }
          }, 350);
        }
      })
    );
  }

  public checkAutoSelect(comboStepButtons: DotButton[]) {
    if (comboStepButtons.length === 1) {
      this.chooseComboButton(comboStepButtons[0]);
      const { ModifiersPage } = comboStepButtons[0] || {};
      // checks if combo component has a ModifiersPage or if the modifiers are visible
      if (
        (!ModifiersPage || !ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, !this.button.isChanged, false))) &&
        !this.isLastStep
      ) {
        this.confirmClick();
      }
    }
  }

  public confirmClick() {
    this.addAutoCompleteModifiers();
    if (this.interfaceCombos.length - 1 === this.currentComboStepIndex) {
      this.button.selectedSize = this.currentSize;
      this.addComputedPrice(this.button['$$forcePriceIn'], this.button['$$forcePriceOut']);

      if (this.button['JumpToPage']) {
        this.router.navigate(['menu', this.button['JumpToPage']]);
      }
      const suggestions = DotSuggestionSalesService.getInstance().getComboSuggestionsByLink(this.button.Link);
      if (suggestions && suggestions.length > 0 && !this.dataParams.fromSuggestions) {
        this.button['parentLinkUUID'] = this.button['parentLinkUUID'] || generateUUID();
        this.dynamicContentService.openContent(this.suggestionComponent, {
          suggestion: new Suggestion(suggestions, this.button['parentLinkUUID']),
        });
      }
      if (!this.dataParams.disableAddButtonToBasket) {
        this.basketService.addButtonToBasket(this.button);
      }
      this.exitAnimation = true;
      setTimeout(() => {
        this.dynamicContentRef.close(this.button);
        if (this.appSettings.viewBasketAfterProductSelection === true && !suggestions && !this.dataParams.fromSuggestions) {
          this.basketService.openBasket(BasketComponent);
        }
      }, 350);
      return;
    }
    this.verticalScrollChange();
    this.currentComboStepIndex++;
    if (this.currentCombo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase()) {
      this.currentCombo.Buttons.forEach((btn) => {
        if (btn.Link === this.currentSize) {
          btn.Selected = true;
          btn.quantity = 1;
        } else {
          btn.Selected = false;
          btn.quantity = 0;
        }
      });
    }
    this.nextStep();
    this.checkAutoSelect(this.comboStepButtons);
  }

  public chooseComboButton(button: DotButton) {
    // RESET BUTTONS & SUB GROUPS
    this.currentCombo.Buttons.forEach((btn) => this.resetSubGroupAndButton(btn));
    this.filteredComboStepButtons.forEach((btn) => this.resetSubGroupAndButton(btn));

    // if subgroup pages exist, open subgroup combostate
    if (button.ButtonType === DotButtonType.ITEM_PACK_BUTTON) {
      this.filterSubgroupButtons(button);
      this.currentComboStepButton = button;
      this.currentComboStepButton.Selected = true;
      this.currentComboStepState = ComboStepState.SUBGROUP;
      return;
    }
    this.currentCombo.Buttons.forEach((btn) => {
      if (this.currentCombo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase() && btn.Link === button.Link) {
        btn.Selected = true;
        btn.quantity = 1;
        this.currentSize = btn.Link;
        this.replaceItemsOnResize(btn.Link, this.button);
        return;
      }
      if (
        btn.Link === button.Link &&
        (btn?.VisibleOn === this.currentSize || this.currentCombo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase())
      ) {
        btn.Selected = true;
        btn.quantity = 1;
        this.currentComboStepButton = btn;
        // if modifier group MinQty not reached and there is no AutoComplete on any modifier, force AutoPopFeat = 1 so the modifiers are visible and the appropriate quantities can be selected
        btn?.ModifiersPage?.Modifiers.forEach((x) => {
          const autoCompleteButton = x.Buttons.find((mod) => mod.AutoComplete === 1);
          const qtyButtons = x.Buttons.reduce((totalQuantity: number, dotBtn: DotButton) => totalQuantity + dotBtn.quantity, 0);
          if (x.PageInfo.MinQuantity && x.PageInfo.MinQuantity > qtyButtons && !autoCompleteButton) {
            x.PageInfo.AutoPopFeat = '1';
          }
          if (btn?.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, !this.button.isChanged, false))) {
            this.verticalScrollChange();
            this.currentComboStepState = ComboStepState.CUSTOMIZE;
          }
        });
      }
    });
  }

  // open subgroup page in combostepper if buttontype = 11
  public chooseComboButtonSubgroup(button: DotButton) {
    this.updateSelectedSubgroupPanelClass(button);

    if (button.ButtonType === DotButtonType.ITEM_PACK_BUTTON) {
      this.currentComboStepButton = button;
      this.currentComboStepButton.Selected = true;
      this.currentComboStepState = ComboStepState.SUBGROUP;
      return;
    }

    this.currentComboStepButton.Selected = true;
    this.currentComboStepButton?.Page?.Buttons.forEach((btn) => {
      if (btn.Link === button.Link && btn?.VisibleOn === this.currentSize) {
        btn.Selected = true;
        btn.quantity = 1;
        // this.currentComboStepButton = btn;
        btn?.ModifiersPage?.Modifiers?.forEach((x) => {
          const autoCompleteButton = x.Buttons.find((mod) => mod.AutoComplete === 1);
          const qtyButtons = x.Buttons.reduce((totalQuantity: number, dotBtn: DotButton) => totalQuantity + dotBtn.quantity, 0);
          if (x.PageInfo.MinQuantity && x.PageInfo.MinQuantity > qtyButtons && !autoCompleteButton) {
            x.PageInfo.AutoPopFeat = '1';
          }
          if (btn?.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, !this.button.isChanged, false))) {
            this.currentComboStepState = ComboStepState.CUSTOMIZE;
          }
        });
      } else {
        btn.Selected = false;
        btn.quantity = 0;
      }
    });
  }

  public getComboStepButtonPrice(button: DotButton) {
    if (this.interfaceCombos[this.currentComboStepIndex].ComboStepType.toLocaleLowerCase() === ComboStepType.ComboUpSize.toLowerCase()) {
      return this.getUpsizeButtonPrice(button.Link);
    }
    const minPrice = this.currentCombo.Buttons.filter((b) => b.VisibleOn === this.currentSize).reduce((acc, btn) => {
      if (acc > calculateButtonPrice(btn, this.sessionService.serviceType)) {
        return calculateButtonPrice(btn, this.sessionService.serviceType);
      }
      return acc;
    }, Number.MAX_SAFE_INTEGER);
    const newPrice = calculateButtonPrice(button, this.sessionService.serviceType) - minPrice;
    return newPrice >= 0 ? newPrice : 0;
  }
  protected nextStep() {
    if (
      this.currentCombo.ComboStepType.toLowerCase() === ComboStepType.ComboUpSize.toLowerCase() ||
      this.currentCombo.Buttons.filter((btn) => btn.VisibleOn === this.currentSize).length > 0
    ) {
      this.currentComboStepState = ComboStepState.CHOOSE;
    } else {
      this.currentCombo.Buttons[0].Selected = true;
      this.currentCombo.Buttons[0].quantity = this.currentCombo.Buttons[0].quantity || 1;
      this.currentComboStepButton = this.currentCombo.Buttons[0];
      this.modifierLabelTextFromComboCatalog();
      this.currentComboStepState = ComboStepState.CUSTOMIZE;
    }
  }
  protected modifierLabelTextFromComboCatalog() {
    this.parentButton?.ComboPage?.Combos?.forEach((combo) => {
      const comboCatalogResult = combo?.Buttons?.find((btn) => btn.Link === this.currentComboStepButton.Link);
      if (comboCatalogResult) {
        this.comboModifierLabelText = this.translateComboModifierLabelPipe.transform(comboCatalogResult);
        return;
      }
    });
  }
  protected replaceItemsOnResize(newSize: string, button: DotButton) {
    button.ComboPage.Combos.filter((c) => c.ComboStepType.toLowerCase() === ComboStepType.ComboStep.toLowerCase()).forEach((combo) => {
      combo.Buttons.forEach((btn, i, arr) => {
        if (btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON) {
          btn.Page?.Buttons?.filter((b) => b.Selected).forEach((b) => {
            const replacer = b.Replacings.find((r) => r.On === newSize)?.With;
            if (replacer) {
              btn.Page?.Buttons?.forEach((s) => {
                if (s.Link === replacer && s.VisibleOn === newSize) {
                  s.Selected = true;
                  s.quantity = 1;
                  if (s.hasModifiers) {
                    s.ModifiersPage = _.cloneDeep(btn.ModifiersPage);
                  }
                }
              });
              b.Selected = false;
              b.quantity = 0;
            }
          });
        }

        if (btn.ButtonType !== DotButtonType.ITEM_PACK_BUTTON && btn.Selected) {
          const replacer = btn.Replacings.find((r) => r.On === newSize)?.With;
          if (replacer) {
            arr.forEach((a) => {
              if (a.Link === replacer && a.VisibleOn === newSize) {
                a.Selected = true;
                a.quantity = 1;
                if (a.hasModifiers) {
                  a.ModifiersPage = _.cloneDeep(btn.ModifiersPage);
                }
              }
            });
            btn.Selected = false;
            btn.quantity = 0;
          }
        }
      });
    });
  }
  protected checkSizeHasReplacings(size: string) {
    return this.button.ComboPage.Combos.every((combo) => combo.Buttons.some((btn) => btn.VisibleOn === size || btn.Link === size));
  }

  protected setModifiersIncludedQuantity() {
    this.comboStepButtons.forEach((x) =>
      x.ModifiersPage?.Modifiers.forEach((modifier) => {
        if (Number.isInteger(modifier.PageInfo.MaxQuantity) && modifier.PageInfo.MaxQuantity > 0) {
          const sumIncludedQuantities = modifier.Buttons.reduce((acc, btn) => {
            acc += btn.IncludedQuantity ? btn.IncludedQuantity : 0;
            return acc;
          }, 0);
          if (sumIncludedQuantities <= modifier.PageInfo.MaxQuantity) {
            modifier.Buttons.forEach((btn) => {
              btn.IncludedQuantity = btn.IncludedQuantity ? btn.IncludedQuantity : 0;
              btn.DefaultQuantity = btn.DefaultQuantity ? btn.DefaultQuantity : 0;
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
                }
                btn.Selected = true;
                btn.quantity = btn.IncludedQuantity;
              }
            });
          }
        }
      })
    );
  }
  protected setDefaultQuantity() {
    this.comboStepButtons.forEach((x) =>
      x.ModifiersPage?.Modifiers?.forEach((modifier) => {
        modifier.Buttons.forEach((btn) => {
          if (btn.DefaultQuantity && btn.DefaultQuantity > 0 && !this.button.isChanged) {
            btn.quantity = btn.DefaultQuantity;
            btn.Selected = true;
            btn.IncludedQuantity = 0;
          }
        });
      })
    );
  }

  protected addComputedPrice(buttonPriceInForced, buttonPriceOutForced): void {
    if (this.button.promoId && this.sessionService.serviceType === PosServingLocation.IN && typeof this.button.ForcePriceIN === 'number') {
      this.button.ForcePriceIN = null;
    } else if (
      this.button.promoId &&
      this.sessionService.serviceType === PosServingLocation.OUT &&
      typeof this.button.ForcePriceOUT === 'number'
    ) {
      this.button.ForcePriceOUT = null;
    }
    this.button.ComputedPrice = calculateButtonPrice(this.button, this.sessionService.serviceType);

    if (
      (typeof buttonPriceInForced !== 'number' && this.sessionService.serviceType === PosServingLocation.IN) ||
      (typeof buttonPriceOutForced !== 'number' && this.sessionService.serviceType === PosServingLocation.OUT)
    ) {
      return;
    }

    switch (this.appSettings.promoDiscountsMode) {
      case PromoDiscountsMode.FULL_DISCOUNT:
        this.button.ForcePriceIN = buttonPriceInForced;
        this.button.ForcePriceOUT = buttonPriceOutForced;
        break;
      case PromoDiscountsMode.EXCLUDE_PRICED_ITEMS:
        this.button.ForcePriceIN = this.button.ComputedPrice * this.button.quantity - this.button.MinPrice + buttonPriceInForced;
        this.button.ForcePriceOUT = this.button.ComputedPrice * this.button.quantity - this.button.MinPrice + buttonPriceOutForced;
        this.button.ComputedPrice = this.button.MinPrice;
        break;
      case PromoDiscountsMode.EXCLUDE_ONLY_PRICED_MODIFIERS:
        let lButton = _.cloneDeep(this.button);
        lButton.ComboPage?.Combos.forEach((combo) => combo.Buttons.forEach((button) => (button.ModifiersPage = null)));
        const lButtonComputedPrice = calculateButtonPrice(lButton, this.sessionService.serviceType);
        if (
          (this.button.promoId && this.sessionService.serviceType === PosServingLocation.IN && typeof buttonPriceInForced === 'number') ||
          (this.sessionService.serviceType === PosServingLocation.OUT && typeof buttonPriceOutForced === 'number')
        ) {
          this.button.ForcePriceIN = this.button.ComputedPrice - lButtonComputedPrice * this.button.quantity + buttonPriceInForced;
          this.button.ForcePriceOUT = this.button.ComputedPrice - lButtonComputedPrice * this.button.quantity + buttonPriceOutForced;
        }
        this.button.ComputedPrice = lButtonComputedPrice;
        lButton = null;
    }
  }

  protected addAutoCompleteModifiers() {
    if (!this.currentComboStepButton?.hasModifiers) {
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

  protected hasComplementModifierSelected(complementId: number): boolean {
    for (const modifier of this.modifiers) {
      if (modifier.Buttons.some((buttonModifier) => Number(buttonModifier.Link) === complementId && buttonModifier.Selected)) {
        return true;
      }
    }
    return false;
  }

  private verticalScrollIncrement() {
    this._scrollIncrement = this.scrollRef ? this.scrollRef?.nativeElement?.clientHeight / 2 : 0;
  }

  private verticalScrollChange() {
    if (this.scrollRef) {
      setTimeout(() => {
        this.scrollRef.nativeElement.scrollTop = 0;
        this.scrollRef.nativeElement.click();
      }, 0);
    }
  }

  private filterSubgroupButtons(button: DotButton = null) {
    const currentComboStep = this.service.getCurrentComboStep(this.currentCombo.ComboStepID);

    if (button.ButtonType === DotButtonType.ITEM_PACK_BUTTON) {
      const currentComboButton = currentComboStep.Buttons.find((btn) => btn.Link === button.Link);

      currentComboButton.Selected = true;
      currentComboButton.quantity = 1;

      this.filteredComboStepButtons = currentComboButton.Page.Buttons.filter(
        (b) => Math.abs(Number(b.VisibleOn)) === Math.abs(Number(this.currentSize))
      );
    }
  }

  private resetSubGroupAndButton(btn: DotButton) {
    // DESELECT SUB GROUP
    if (btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON) {
      btn.Page.Buttons.forEach((b) => {
        b.Selected = false;
        b.quantity = 0;
      });
    }

    // DESELECT BUTTON
    btn.Selected = false;
    btn.quantity = 0;
  }

  private updateSelectedSubgroupPanelClass(button: DotButton) {
    this.filteredComboStepButtons.forEach((b: DotButton) => {
      b.Selected = b.Link === button.Link;
      b.quantity = Number(b.Link === button.Link);
    });
  }
}
