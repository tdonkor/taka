import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {
  BannersComponent,
  CalculateTotalsComponent,
  CheckoutErrorComponent,
  CodViewComponent,
  CompleteOrderComponent,
  GloryCashInfoComponent,
  GloryLegalRequirementsComponent,
  GloryPaymentProgressComponent,
  MenuComponent,
  OpenOrderComponent,
  OrderNumberComponent,
  PaymentProgressComponent,
  PaymentSelectionComponent,
  PreorderComponent,
  PromosComponent,
  ServiceTypeComponent,
  TableServiceConfirmationComponent,
  TableServiceEntryComponent,
  TableServiceSelectionComponent,
  TableServiceUnavailableComponent,
  TenderOrderComponent,
} from './pages';

const routes: Routes = [
  {
    path: 'banners',
    component: BannersComponent,
  },
  {
    path: 'service-type',
    component: ServiceTypeComponent,
  },
  {
    path: 'menu/:pageId',
    component: MenuComponent,
  },
  {
    path: 'payment-selection',
    component: PaymentSelectionComponent,
  },
  {
    path: 'payment-progress',
    component: PaymentProgressComponent,
  },
  {
    path: 'checkout-error',
    component: CheckoutErrorComponent,
  },
  {
    path: 'open-order',
    component: OpenOrderComponent,
  },
  {
    path: 'calculate-totals',
    component: CalculateTotalsComponent,
  },
  {
    path: 'complete-order',
    component: CompleteOrderComponent,
  },
  {
    path: 'tender-order',
    component: TenderOrderComponent,
  },
  {
    path: 'order-number',
    component: OrderNumberComponent,
  },
  {
    path: 'cod-view',
    component: CodViewComponent,
  },
  {
    path: 'promos',
    component: PromosComponent,
  },
  {
    path: 'ts-selection',
    component: TableServiceSelectionComponent,
  },
  {
    path: 'ts-confirmation',
    component: TableServiceConfirmationComponent,
  },
  {
    path: 'ts-unavailable',
    component: TableServiceUnavailableComponent,
  },
  {
    path: 'ts-entry',
    component: TableServiceEntryComponent,
  },
  {
    path: 'preorder',
    component: PreorderComponent,
  },
  {
    path: 'glory-legal-requirements',
    component: GloryLegalRequirementsComponent,
  },
  {
    path: 'glory-payment-progress',
    component: GloryPaymentProgressComponent,
  },
  {
    path: 'glory-cash-info/:action',
    component: GloryCashInfoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
