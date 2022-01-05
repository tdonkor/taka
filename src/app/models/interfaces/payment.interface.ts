import { InventoryStatus } from '../enums/general.enum';
import { PAYMENT_TYPE } from '../enums/payment-type.enum';

export interface PaymentType {
  PaymentType: PAYMENT_TYPE;
  PaymentName: string;
  Image: string;
  PaymentRetries: number;
  PaymentIsEnabled: boolean;
  TenderMediaID?: string;
  DisplayName?: string;
  InventoryStatus?: InventoryStatus;
  Icon?: string[];
}
