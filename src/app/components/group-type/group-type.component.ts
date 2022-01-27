import {
  AfterContentChecked,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Type,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Animations } from '@dotxix/animation';
import { enabledTouchlessMode, isAdaEnabled, isAutoPopFeatVisible, log } from '@dotxix/helpers';
import { Suggestion } from '@dotxix/models';
import { DotCdkTitleTranslatePipe, TranslateCatalogModifierLabel } from '@dotxix/pipes';
import {
  AbstractDynamicComponent,
  ApplicationSettingsService,
  BasketService,
  DynamicContentParams,
  DynamicContentRef,
  DynamicContentService,
  SessionService,
} from '@dotxix/services';

import { DotButton, DotModifier, calculateButtonPrice, DotSuggestionSalesService, DotButtonType, generateUUID } from 'dotsdk';
import * as _ from 'lodash';
import { BasketComponent } from '../basket/basket.component';
import { ButtonDetailsComponent } from '../button-details/button-details.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'acr-group-type',
  templateUrl: './group-type.component.html',
  styleUrls: ['./group-type.component.scss'],
  animations: [Animations.popupIn, Animations.popupOut],
})
export class GroupTypeComponent  extends AbstractDynamicComponent
  implements OnDestroy, OnInit, AfterViewInit, AfterContentChecked, AfterViewChecked  {
  public get unitPrice(): string {
    return this.button.Price;
  }
  public get modifiers(): DotModifier[] {
    return this.button.hasModifiers ? this.button.ModifiersPage.Modifiers : [];
  }
  public get buttonPrice(): number {
    return calculateButtonPrice(this.button, this.sessionService.serviceType);
  }

  public title = '';
  public itemPrice = 0;

  public get buttons() {
    return this.button;
  }

  public get displayModifierButtons(): boolean {
    // if modifier group MinQty not reached and there is no AutoComplete on any modifier, force AutoPopFeat = 1 so the modifiers are visible and the appropriate quantities can be selected
    for (const modifier of this.modifiers) {
      const autoCompleteButton = modifier.Buttons.find((mod) => mod.AutoComplete === 1);
      const qtyButtons = modifier.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
      if (modifier.PageInfo.MinQuantity && modifier.PageInfo.MinQuantity > qtyButtons && !autoCompleteButton) {
        modifier.PageInfo.AutoPopFeat = '1';
      }
    }
    return this.modifiers.filter((modifier) => isAutoPopFeatVisible(modifier, !this.button.isChanged, true)).length > 0;
  }

  public get isButtonChanged() {
    return this.button.isChanged;
  }

  public get price(): number {
    return this.buttonPrice * this.button.quantity;
  }
  public get calories(): string {
    const calories = this.button?.AllergensAndNutritionalValues?.NutritionalValues?.find((val) => val.Name === 'CAL');
    return calories ? calories.Value : '';
  }
  public get getQuantityButtons() {
    let totalQty = 0;
    this.modifiers.some((y) =>
      y.Buttons.filter((btn) => btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON).forEach((x) => {
        totalQty += x.Page.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
      })
    );
    this.modifiers.forEach(
      (x) => (totalQty += x.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0))
    );
    return totalQty;
  }

  public get disableConfirmButton(): boolean {
    return this.modifiers.length === 0
      ? this.button.quantity < this.button.MinQuantity
      : this.modifiers
        .filter((modif) => isAutoPopFeatVisible(modif, !this.button.isChanged, true))
        .some((modifier) => {
          return (
            this.getQuantityButtons < modifier.PageInfo.MinQuantity &&
            !this.modifiers.some((x) => x.Buttons.find((y) => y.AutoComplete === 1))
          );
        });
  }

  public get scrollIncrement(): number {
    return this._scrollIncrement;
  }
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  @ViewChild('modifierMessagesTpl') public modifierMessagesTpl: ElementRef;

  public enabledTouchlessMode = enabledTouchlessMode;
  public button: DotButton | any;
  public exitAnimation = false;
  public catalogModifierLabelText?: string;
  public isAdaEnabled = isAdaEnabled;
  public subscriptions: Subscription[] = [];
  private _scrollIncrement;

  constructor(
    protected dataParams: DynamicContentParams,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected dynamicContentRef: DynamicContentRef,
    protected dynamicContentService: DynamicContentService,
    protected titleTranslatePipe: DotCdkTitleTranslatePipe,
    protected appSettings: ApplicationSettingsService,
    protected basketService: BasketService,
    protected sessionService: SessionService,
    private ref: ChangeDetectorRef,
    @Inject('SUGGESTION_COMPONENT') protected suggestionComponent: Type<AbstractDynamicComponent>,
    private translateCatalogModifierLabel: TranslateCatalogModifierLabel
  ) {
    super();
  }

  public ngOnInit(): void {
    // console.log(this.dataParams, 'BTNBTNBTNBTNBTNBTNBTN');

    this.button = _.cloneDeep(this.dataParams.btn.Page.Buttons);
    // console.log(this.button, 'SSSSSSSSSSSSSSSSSSSSS');

    this.title = this.dataParams.btn.Page.Name;
    console.log('price: ' + this.button.name);

    this.button.quantity = this.button.quantity ? this.button.quantity : 1;
    this.catalogModifierLabelText = this.translateCatalogModifierLabel.transform(this.button);
  }

  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public ngAfterContentChecked() {
    this.ref.detectChanges();

  }

  public ngAfterViewChecked() {
    this.ref.detectChanges();
  }

  public ngAfterViewInit() {
    this.verticalScrollIncrement();
  }

  public onQuantityUpdate(count: 1 | -1): void {
    if (count > 0) {
      this.button.Selected = true;
      this.button.quantity++;
    } else {
      if (this.button.quantity > 1) {
        this.button.quantity--;
      }
    }
  }

  public quantity(): number {
    return (this.button.quantity = this.button.quantity === 0 ? 1 : this.button.quantity);
  }

  public confirmClick(): void {
    this.button['$$suggestionChanged'] = true;
    if (this.button['JumpToPage']) {
      this.router.navigate(['menu', this.button['JumpToPage']]);
    }
    const suggestions = DotSuggestionSalesService.getInstance().getButtonSuggestionByLink(this.button.Link);

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
    // this.basketService.openBasket(BasketComponent);
    // log('button added:', this.button);
  }

  public cancelClick(): void {
    this.button['$$suggestionChanged'] = false;
    this.exitAnimation = true;
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

  public selectCookType(btn) {

    this.button.map((val) => {
      val.Selected = val.Link === btn.linkType ? true : false;
      val.PageType = 'group';
    });

    this.cancelClick();
    this.openDynamicContentService(ButtonDetailsComponent, btn);
  }

  private verticalScrollIncrement() {
    this._scrollIncrement = this.scrollRef ? this.scrollRef?.nativeElement?.clientHeight / 1.2 : 0;
  }

  private openDynamicContentService(componentClass: Type<AbstractDynamicComponent>, button: DotButton) {
    const componentRef = this.dynamicContentService.openContent(componentClass, { btn: button });
    // this.subscriptions.push(componentRef.afterClosed.subscribe(() => (this.dropdownPage = { display: false })));
  }
}


