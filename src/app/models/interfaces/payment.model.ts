export interface PaymentModel {
  cash: CashPaymentModel;
  gift: GiftPaymentModel;
  amountOwed: number;
  paymentName: string;
  disableCashPayment?: boolean;
  disableGiftPayment?: boolean;
  paymentType?: string;
}

export interface CashPaymentModel {
  amountPaidCurrent: number;
  amountPaidTotal: number;
  amountRefunded: number;
  initialAmountThatCanBePaidWithCash: number;
}

export interface GiftPaymentModel {
  amountPaidCurrent: number;
  amountPaidTotal: number;
}
