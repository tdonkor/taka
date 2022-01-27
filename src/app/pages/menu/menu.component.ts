import { ActivatedRoute, Router } from '@angular/router';
import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Type, ViewChild } from '@angular/core';
import { DotAvailabilityService, DotButton, DotButtonType, DotPage, getMainPage, getPage } from 'dotsdk';

import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { AllergensService } from '../../services/allergens.service';
import { ApplicationSettingsService } from '../../services/app-settings.service';
import { BasketService } from '../../services/basket.service';
import { CheckoutService } from '../../services/checkout.service';
import { ContentService } from '../../services/content.service';
import { DynamicContentService } from '../../services/dynamic-content/dynamic-content.service';

import { DotCdkTranslatePipe } from '../../pipes/dot-translate.pipe';
import { ButtonDetailsComponent } from '../../components/button-details/button-details.component';
import { ComboStepperComponent } from '../../components/combo-stepper/combo-stepper.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { MakeItAMealComponent } from '../../components/make-it-a-meal/make-it-a-meal.component';

import { enabledTouchlessMode } from '../../helpers/ada.helper';
import { getTouchlessClass } from '../../helpers/ada.helper';
import { isAdaEnabled } from '../../helpers/ada.helper';
import { log } from '../../helpers/log.helper';

import { ProductStatus } from '../../models/enums/general.enum';
import { AbstractDynamicComponent } from '../../services/dynamic-content/models/abstract-dynamic.component';
import { GroupTypeComponent } from '@dotxix/components/group-type/group-type.component';
interface DropdownPage {
  display: boolean;
  row?: number;
  buttonLink?: string;
  page?: DotPage;
}

@Component({
  selector: 'acr-menu',
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnDestroy, OnInit, AfterViewChecked, AfterViewInit {
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  public enabledTouchlessMode = enabledTouchlessMode;
  public isAdaEnabled = isAdaEnabled;
  public getTouchlessClass = getTouchlessClass;
  public page: DotPage;
  public dropdownPage: DropdownPage = { display: false };
  public unavailable = false;
  public subscriptions: Subscription[] = [];
  private _scrollIncrement;

  public get basketButtons(): DotButton[] {
    return this.basketService.buttons;
  }
  public get basketTitle(): string {
    if (this.basketButtonLength === 0) {
      return this.translatePipe.transform('6');
    }
    if (this.basketButtonLength === 1) {
      return this.translatePipe.transform('19');
    }
    return this.translatePipe.transform('92');
  }
  public get basketButtonLength(): number {
    return this.basketService.buttons.length;
  }

  public get displayBackButton(): boolean {
    return this.page.ID !== getMainPage()?.ID;
  }

  public get scrollIncrement(): number {
    return this._scrollIncrement;
  }

  constructor(
    public appSettings: ApplicationSettingsService,
    public basketService: BasketService,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected location: Location,
    protected checkoutService: CheckoutService,
    protected dynamicContentService: DynamicContentService,
    protected translatePipe: DotCdkTranslatePipe,
    protected contentService: ContentService,
    protected allergenService: AllergensService,
    protected cdRef: ChangeDetectorRef
  ) {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const pageId = params.get('pageId');
        const page = getPage(pageId, true);
        this.page = page ? page : getMainPage();
        log('page: ', this.page);
      })
    );
  }
  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
  public ngOnInit() {}
  public ngAfterViewInit() {
    this.verticalScrollIncrement();
  }
  public ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  public isDropdownOpen(link: string): boolean {
    return this.dropdownPage.buttonLink === link;
  }

  public select(button: DotButton) {
    if (this.unavailableButton(button)) {
      return;
    }
    if (
      !button.Page &&
      button?.AllergensAndNutritionalValues?.Allergens.some((a) =>
        this.allergenService.selectedAllergens.some((allergen) => a.Name.includes(allergen.Name))
      )
    ) {
      const hasFullAllergen = button?.AllergensAndNutritionalValues?.Allergens.some((a) =>
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
            this.navigateToNextScreen(button);
          }
        })
      );
    } else {
      if (!button.Page && this.hasDlgMessages(button)) {
        const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
          button,
          leftButtonText: this.translatePipe.transform('23'),
          rightButtonText: this.translatePipe.transform('28'),
        });
        this.subscriptions.push(
          contentRef.afterClosed.subscribe((response) => {
            if (response === 'Yes') {
              this.navigateToNextScreen(button);
            }
          })
        );
      } else {
        this.navigateToNextScreen(button);
      }
    }

    // new group code added by TD

    // button.Page.PageType
    if (button.Page?.PageType === 'Group') {

      this.openDynamicContentService(GroupTypeComponent, button);
      return;

    }
  }

  public isButtonStatusUnavailable(button: DotButton): boolean {
    return Number(button.ButtonStatus) === ProductStatus.UNAVAILABLE;
  }

  public back() {
    this.location.back();
    this.dropdownPage = { display: false };
  }

  public addButtonToBasket(button: DotButton) {
    this.basketService.addButtonToBasket(button);
  }

  public onNavButtonClick() {
    this.dropdownPage = { display: false };
  }

  public hasDlgMessages(button: DotButton) {
    return (
      (button.DlgMessageDictionary && Object.keys(button.DlgMessageDictionary).length > 0) ||
      (button.DlgMessage !== null && button.DlgMessage.length > 0)
    );
  }

  public unavailableButton(button: DotButton) {
    if (button.hasCombos) {
      // tslint:disable-next-line: no-shadowed-variable
      return button.ComboPage.Combos.filter((btn) => btn.Buttons.every((button) => button.ButtonStatus === '2')).length > 0;
    } else if (button.Page) {
        return button.Page.PageTemplate?.toLowerCase() === 'dropdown' && button.Page.Buttons.every((btn) => Number(btn.ButtonStatus) === ProductStatus.UNAVAILABLE);
    } else {
      return false;
    }
  }

  public onVerticalScrollButtonClick() {
    this.dropdownPage = { display: false };
  }

  protected navigateToNextScreen(button: DotButton) {
    if (!button.Page && !button.hasCombos) {
      if (this.dropdownPage.display && !this.dropdownPage.page.Buttons.map((b) => b.Link).includes(button.Link)) {
        this.dropdownPage = { display: false };
      }

      if (
        button?.MakeItAMeal &&
        button.MakeItAMeal.length > 0 &&
        button.MakeItAMeal.some((btn) => btn.ButtonType === DotButtonType.MENU_BUTTON || btn.ButtonType === DotButtonType.ITEM_BUTTON)
      ) {
        const contentRef = this.dynamicContentService.openContent(MakeItAMealComponent, { btn: button.MakeItAMeal });
        this.subscriptions.push(
          contentRef.afterClosed.subscribe((response) => {
            if (response === 'No') {
              // this.dynamicContentService.openContent(ButtonDetailsComponent, { btn: button });
              this.openDynamicContentService(ButtonDetailsComponent, button);
              return;
            }
          })
        );
      } else {
        // this.dynamicContentService.openContent(ButtonDetailsComponent, { btn: button });
        this.openDynamicContentService(ButtonDetailsComponent, button);
        return;
      }
    }
    if (button.hasCombos && !this.unavailableButton(button)) {
      this.openDynamicContentService(ComboStepperComponent, button);
    }
    // are: delete this condition once buttons with modifiers and combos are handled
    if (!button.Page) {
      return;
    }
    if (button.Page.PageTemplate?.toLocaleLowerCase() === 'dropdown') {
      if (!this.dropdownPage.display || this.dropdownPage.buttonLink !== button.Link) {
        this.openDropdown(button);
      } else {
        this.dropdownPage = { display: false };
      }
    } else {
      this.router.navigate(['menu', button.Page.ID]);
      this.dropdownPage = { display: false };
    }
  }

  private openDynamicContentService(componentClass: Type<AbstractDynamicComponent>, button: DotButton) {
    const componentRef = this.dynamicContentService.openContent(componentClass, { btn: button });
    this.subscriptions.push(componentRef.afterClosed.subscribe(() => (this.dropdownPage = { display: false })));
  }

  private openDropdown(button: DotButton) {
    log('page: ', button.Page);
    const index = this.page.Buttons.filter((b) => DotAvailabilityService.getInstance().isButtonAvailable(b)).findIndex(
      (btn) => btn.Link === button.Link
    );
    if (index >= 0) {
      this.dropdownPage = {
        display: true,
        row: !isAdaEnabled() ? Math.trunc(index / 3) + 2 : Math.trunc(index / 4) + 2,
        buttonLink: button.Link,
        page: button.Page ? button.Page : null,
      };
    } else {
      this.dropdownPage = {
        display: false,
      };
    }
  }
  private verticalScrollIncrement() {
    this._scrollIncrement = this.scrollRef ? this.scrollRef?.nativeElement?.clientHeight / 3 : 0;
  }
}
