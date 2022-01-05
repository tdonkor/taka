import { OrderDiscountResponse, PromoNode, PromotionQuery, PromotionsService } from 'dotsdk';

import { Injectable } from '@angular/core';
import { PromoResponseType } from '../models';

export interface PromoDefinition {
  name: string;
  barcode: string;
  UUID: string;
}

@Injectable({
  providedIn: 'root',
})
export class PromosService {
  public isAppliedOrderDiscount = false;
  public orderDiscountPromoInfo: OrderDiscountResponse;
  public promoNode: PromoNode;
  public errorMessage: string;
  public promotionQuery: PromotionQuery;
  public scannedBarcodes: PromoDefinition[] = [];
  constructor() {}

  public findPromoByBarcode(promoCode: string): number {
    const promotionService = new PromotionsService();
    this.promotionQuery = promotionService.getPromoByBarcode(promoCode);
    if (this.promotionQuery && this.promotionQuery.success) {
      if (this.promotionQuery.promoPayload instanceof OrderDiscountResponse) {
        this.orderDiscountPromoInfo = this.promotionQuery.promoPayload;
        this.isAppliedOrderDiscount = this.orderDiscountPromoInfo.isServiceChargeApplied();
        return PromoResponseType.ORDER_DISCOUNT;
      } else if (this.promotionQuery.promoPayload instanceof PromoNode) {
        this.promoNode = this.promotionQuery.promoPayload;
        return PromoResponseType.PROMO_NODE;
      }
    }
    this.errorMessage = this.promotionQuery?.message ? this.promotionQuery?.message : '';
    return PromoResponseType.PROMO_ERROR;
  }

  public resetPromos() {
    this.isAppliedOrderDiscount = false;
    this.orderDiscountPromoInfo = null;
    this.promoNode = null;
    this.errorMessage = '';
    this.scannedBarcodes.length = 0;
  }
}
