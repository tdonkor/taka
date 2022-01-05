import * as _ from 'lodash';

import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DotButton, DotPage } from 'dotsdk';
import { LinkToParentStatus, Suggestion } from '@dotxix/models';

import { Subscription } from 'rxjs';
import { Animations } from '@dotxix/animation';
import { AbstractDynamicComponent, BasketService, DynamicContentParams, DynamicContentRef, DynamicContentService } from '@dotxix/services';
import { enabledTouchlessMode, isAutoPopFeatVisible } from '@dotxix/helpers';
import { ButtonDetailsComponent } from '../button-details/button-details.component';
import { ComboStepperComponent } from '../combo-stepper/combo-stepper.component';

@Component({
  selector: 'acr-suggestion-sales',
  templateUrl: './suggestion-sales.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
})
export class SuggestionSalesComponent extends AbstractDynamicComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  public enabledTouchlessMode = enabledTouchlessMode;
  public exitAnimation = false;
  public subscriptions: Subscription[] = [];
  public suggestion: Suggestion;
  private _scrollIncrement;

  // public page: DotPage;

  public get page(): DotPage {
    return this.suggestion.currentSuggestionPage;
  }

  public get displayMaxQuantityMessage(): boolean {
    if (this.page.MaxQty && this.page.MaxQty > 0) {
      return this.page.Buttons.reduce((acc, button) => acc + button.quantity, 0) >= this.page.MaxQty;
    }
    return false;
  }

  public get totalQuantity(): number {
    return this.page.Buttons.reduce((acc, button) => acc + button.quantity, 0);
  }

  public get disableAddToBag(): boolean {
    return !this.page.Buttons.some((btn) => btn.Selected && btn.quantity > 0);
  }

  public get scrollIncrement(): number {
    return this._scrollIncrement;
  }

  constructor(
    private dataParams: DynamicContentParams,
    private dynamicContentRef: DynamicContentRef,
    private dynamicContentService: DynamicContentService,
    private basketService: BasketService,
    private cdRef: ChangeDetectorRef
  ) {
    super();
  }

  public ngOnInit() {
    this.suggestion = this.dataParams.suggestion;
    // this.buttons = _.cloneDeep(this.page.Buttons);
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  public ngAfterViewInit() {
    this.verticalScrollIncrement();
  }

  public isUnavailableButton(button: DotButton): boolean {
    return button?.MaxQuantity === 0;
  }

  public onButtonClick(button: DotButton) {
    if (button.hasModifiers && button.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, true, true))) {
      const modifierRef = this.dynamicContentService.openContent(ButtonDetailsComponent, {
        btn: button,
        disableAddButtonToBasket: true,
        fromSuggestions: true,
      });
      this.subscriptions.push(
        modifierRef.afterClosed.subscribe((btn) => {
          if (btn['$$suggestionChanged']) {
            const index = this.page.Buttons.findIndex((b) => btn.Link === b.Link);
            if (index >= 0) {
              this.page.Buttons.splice(index, 1, btn);
              this.page.Buttons = [...this.page.Buttons];
            }
            btn.Selected = true;
          }
        })
      );
    } else if (button.hasCombos) {
      const comboStepperRef = this.dynamicContentService.openContent(ComboStepperComponent, {
        btn: button,
        disableAddButtonToBasket: true,
        fromSuggestions: true,
      });
      this.subscriptions.push(
        comboStepperRef.afterClosed.subscribe((btn) => {
          if (btn.Selected) {
            const index = this.page.Buttons.findIndex((b) => btn.Link === b.Link);
            if (index >= 0) {
              this.page.Buttons.splice(index, 1, btn);
              this.page.Buttons = [...this.page.Buttons];
            }
          }
        })
      );
    } else if (!button.Selected) {
      button.Selected = true;
      button.quantity = 1;
    } else if (this.page.Buttons.reduce((acc, b) => acc + b.quantity, 0) < this.page.MaxQty) {
      button.quantity++;
    }
  }
  public isButtonDisabled(button: DotButton): boolean {
    if (this.page.MaxQty === 1) {
      return false;
    }
    return !button.Selected && this.page.Buttons.reduce((acc, b) => acc + b.quantity, 0) >= this.page.MaxQty;
  }

  public cancelClick() {
    this.nextPage();
  }
  public addToBasketClick() {
    this.page.Buttons.filter((b) => b.Selected && b.quantity > 0).forEach((btn) => {
      if (btn?.['LinkToParent'] === LinkToParentStatus.LINKED) {
        btn['childLinkUUID'] = this.suggestion.parentLinkUUID;
      }
      this.basketService.addButtonToBasket(btn);
    });
    this.nextPage();
  }

  public quantityChanged(button: DotButton, changedQuantity?: number) {
    if (changedQuantity > 0) {
      if (
        (button.hasCombos ||
          (button.hasModifiers && button.ModifiersPage?.Modifiers.some((mod) => isAutoPopFeatVisible(mod, true, true)))) &&
        button.quantity <= 0
      ) {
        this.onButtonClick(button);
      } else if ((this.page.MaxQty && this.totalQuantity < this.page.MaxQty) || (!this.page.MaxQty && this.totalQuantity >= 0)) {
        button.Selected = true;
        button.quantity++;
      }
    } else if (changedQuantity < 0) {
      button.quantity--;
      if (button.quantity === 0) {
        this.removeSubitemsQuantity(button);
      }
    }
  }

  private nextPage() {
    if (this.suggestion.isLastPage) {
      this.exitAnimation = true;
      setTimeout(() => this.dynamicContentRef.close(), 500);
    } else {
      this.suggestion.next();
      this.exitAnimation = true;
      setTimeout(() => (this.exitAnimation = false), 500);
    }
  }

  private removeSubitemsQuantity(item: any) {
    Object.keys(item).forEach((key) => {
      if (typeof item[key] === 'object' && item[key]) {
        this.removeSubitemsQuantity(item[key]);
      } else if (key === 'Selected') {
        item[key] = false;
      } else if (key === 'quantity') {
        item[key] = 0;
      }
    });
  }

  private verticalScrollIncrement() {
    this._scrollIncrement = this.scrollRef ? this.scrollRef?.nativeElement?.clientHeight / 2 : 0;
  }
}
