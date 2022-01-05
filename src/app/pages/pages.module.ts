import { BannersComponent } from './banners/banners.component';
import { CalculateTotalsComponent } from './checkout/calculate-totals/calculate-totals.component';
import { CheckoutErrorComponent } from './checkout/checkout-error/checkout-error.component';
import { CodViewComponent } from './checkout/cod-view/cod-view.component';
import { CommonModule } from '@angular/common';
import { CompleteOrderComponent } from './checkout/complete-order/complete-order.component';
import { ComponentsModules } from '../components/components.module';
import { GloryCashInfoComponent } from './checkout/glory/cash-info/glory-cash-info.component';
import { GloryLegalRequirementsComponent } from './checkout/glory/legal-requirements/glory-legal-requirements.component';
import { GloryPaymentProgressComponent } from './checkout/glory/payment-progress/glory-payment-progress.component';
import { LoadingComponent } from './checkout/loading/loading.component';
import { MenuComponent } from './menu/menu.component';
import { NgModule } from '@angular/core';
import { OpenOrderComponent } from './checkout/open-order/open-order.component';
import { OrderNumberComponent } from './checkout/order-number/order-number.component';
import { PaymentProgressComponent } from './checkout/payment-progress/payment-progress.component';
import { PaymentSelectionComponent } from './checkout/payment-selection/payment-selection.component';
import { PipesModule } from '../pipes/pipes.modules';
import { PromosComponent } from './promotions/promos.component';
import { ServiceTypeComponent } from './service-type/service-type.component';
import { TenderOrderComponent } from './checkout/tender-order/tender-order.component';

export const PAGES = [
  BannersComponent,
  ServiceTypeComponent,
  MenuComponent,
  PaymentSelectionComponent,
  PaymentProgressComponent,
  CheckoutErrorComponent,
  OpenOrderComponent,
  LoadingComponent,
  CalculateTotalsComponent,
  CompleteOrderComponent,
  TenderOrderComponent,
  OrderNumberComponent,
  CodViewComponent,
  PromosComponent,
  GloryLegalRequirementsComponent,
  GloryPaymentProgressComponent,
  GloryCashInfoComponent,
];

@NgModule({
  imports: [CommonModule, ComponentsModules, PipesModule],
  declarations: [PAGES],
  exports: [PAGES],
})
export class PagesModule {}
