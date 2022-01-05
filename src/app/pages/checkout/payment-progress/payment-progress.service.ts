import { Injectable } from '@angular/core';
import { PosRefintService, AtpPaymentService, PosElogHandler, PosOperationDevicesTypes, PosPaidState, PosTenderType } from 'dotsdk';
import { DotCdkTranslatePipe } from '../../../pipes/dot-translate.pipe';
import { DynamicContentService } from '../../../services/dynamic-content/dynamic-content.service';
import { ApplicationSettingsService } from '../../../services/app-settings.service';
import { CheckoutService } from '../../../services/checkout.service';
import { PaymentModelService } from '../../../services/payment-model.service';

@Injectable({
  providedIn: 'root'
})

export class PaymentProgressService {
  constructor(
    protected checkoutService: CheckoutService,
    protected dynamicContentService: DynamicContentService,
    protected paymentModelService: PaymentModelService,
    protected translatePipe: DotCdkTranslatePipe,
    protected appSettingsService: ApplicationSettingsService) {
  }
  public async sendOrderToCardPay(): Promise<any> {
    const transactionReference = this.checkoutService.orderPOSNumber ? this.checkoutService.orderPOSNumber.toString() : PosRefintService.getInstance()._refInt.toString();
    const payResult = await AtpPaymentService.getInstance()
      .pay(this.paymentModelService.getAmountOwed(), transactionReference)
      .catch(() => null);
    if (payResult && payResult.PaidAmount) {
      payResult.TenderMediaId = payResult.TenderMediaId || payResult.TenderMediaId === '0' ? payResult.TenderMediaId : '-1';
      PosElogHandler.getInstance().posConfig.posHeader.operations.push({
        deviceType: PosOperationDevicesTypes.PAY,
        time: new Date(),
        id: '1',
        name: 'PAY 1',
        operation: 'DoPayment',
        status: 1,
        code: 0,
      });
      this.addElogTender(payResult['TenderMediaId']);
      return Promise.resolve(payResult);
    } else {
      // return await this.failPayment();
      return Promise.resolve('orderNotPaid');
    }
  }

  protected addElogTender(tenderMediaId: string) {
    const cardTender = {
      paid: PosPaidState.PAID,
      type: PosTenderType.CARD,
      paymentMediaId: tenderMediaId,
      paidAmount: this.paymentModelService.getAmountOwed()
    };
    (PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders) ?
      PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders.push(cardTender) :
      PosElogHandler.getInstance().posConfig.posHeader.amounts.tenders = [cardTender];
  }
}
