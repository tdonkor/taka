import { AdaBannersComponent } from './ada-banners/ada-banners.component';
import { AllergenSelectionComponent } from './allergen-selection/allergen-selection.component';
import { BasketComponent } from './basket/basket.component';
import { ButtonComponent } from './button/button.component';
import { ButtonDetailsComponent } from './button-details/button-details.component';
import { ButtonModifierComponent } from './button-modifier/button-modifier.component';
import { ButtonModifierListComponent } from './button-modifier-list/button-modifier-list.component';
import { ButtonModifierSubgroupComponent } from './button-modifier-subgroup/button-modifier-subgroup.component';
import { ButtonsCounterEditComponent } from './buttons-counter-edit/buttons-counter-edit.component';
import { CaloriesComponent } from './calories/calories.component';
import { CollapsibleComponent } from './collapsible/collapsible.component';
import { ComboStepperComponent } from './combo-stepper/combo-stepper.component';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { FooterActionsComponent } from './footer-actions/footer-actions.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import { KeyboardComponent } from './keyboard/keyboard.component';
import { MakeItAMealComponent } from './make-it-a-meal/make-it-a-meal.component';
import { NavSliderComponent } from './nav-slider/nav-slider.component';
import { NgModule } from '@angular/core';
import { OrderButtonComponent } from './basket/order-button/order-button.component';
import { PaymentLogosComponent } from './payment-logos/payment-logos.component';
import { PaymentRetryComponent } from './payment-retry/payment-retry.component';
import { PipesModule } from '../pipes/pipes.modules';
import { ProductCardComponent } from './product-card/product-card.component';
import { PromoStepperComponent } from './promo-stepper/promo-stepper.component';
import { ScanComponent } from './scan/scan.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { StatusComponent } from './status/status.component';
import { StepsComponent } from './combo-stepper/stepper/steps.component';
import { SuggestionSalesComponent } from './suggestion-sales/suggestion-sales.component';

import { VerticalScrollButtonsComponent } from './vertical-scroll-buttons/vertical-scroll-buttons.component';
import { VoucherInfoComponent } from './voucher-info/voucher-info.component';

import {
  PreorderComponent,
  TableServiceConfirmationComponent,
  TableServiceEntryComponent,
  TableServiceSelectionComponent,
  TableServiceUnavailableComponent,
} from '../pages/';

const COMPONENTS = [
  ButtonComponent,
  ButtonsCounterEditComponent,
  ButtonModifierComponent,
  FooterActionsComponent,
  VoucherInfoComponent,
  OrderButtonComponent,
  ProductCardComponent,
  DropdownComponent,
  StatusComponent,
  CollapsibleComponent,
  NavSliderComponent,
  ButtonModifierListComponent,
  SpinnerComponent,
  KeyboardComponent,
  ScanComponent,
  TableServiceSelectionComponent,
  TableServiceConfirmationComponent,
  TableServiceUnavailableComponent,
  TableServiceEntryComponent,
  PreorderComponent,
  PaymentLogosComponent,
  StepsComponent,
  VerticalScrollButtonsComponent,
];

const ENTRY_COMPONENTS = [
  ConfirmDialogComponent,
  BasketComponent,
  ComboStepperComponent,
  ButtonDetailsComponent,
  CaloriesComponent,
  AllergenSelectionComponent,
  SuggestionSalesComponent,
  PaymentRetryComponent,
  MakeItAMealComponent,
  AdaBannersComponent,
  InfoDialogComponent,
  PromoStepperComponent,
  ButtonModifierSubgroupComponent
];
@NgModule({
  imports: [CommonModule, PipesModule],
  declarations: [ENTRY_COMPONENTS, COMPONENTS],
  entryComponents: [ENTRY_COMPONENTS],
  exports: [COMPONENTS, ENTRY_COMPONENTS],
})
export class ComponentsModules {}
