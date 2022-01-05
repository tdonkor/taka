import { Injectable } from '@angular/core';
import {
  AtpApplicationSettings,
  basketService,
  DotButton,
  OrderResponse,
  RecoAbortMethodEnum,
  RecommendationsService,
  RecoOrderState,
  RecoPaymentMethod,
  UpdateItemResponse,
  UpdateOrderOptions,
} from 'dotsdk';
import { PAYMENT_TYPE } from '../../models/enums/payment-type.enum';
import { SessionEndType } from '../session.service';
import { RecoContext } from './models/reco.context.model';
import { SuggestionsSaleService } from './suggestions-sale.service';

@Injectable({providedIn: 'root'})
export class RecommendationService {
  public readonly recoCallsTimeout: number = 1000;
  public recoOrder: OrderResponse;
  constructor(private suggestionSaleService: SuggestionsSaleService) {}
  public createOrderForReco() {
    return RecommendationsService.getInstance().createOrder(basketService.currentCart, {
      kioskId: AtpApplicationSettings.getInstance().bundleSettingsJson.kioskId,
      nestId: AtpApplicationSettings.getInstance().environmentDetailsJson.NestIdentifier,
      recommendationMode: this.suggestionSaleService.strategyInstance.recommendationMode,
    } as RecoContext, this.recoCallsTimeout);
  }

  public mapCancelOrderEventToReco(cancelOrderEvent: SessionEndType) {
    if (cancelOrderEvent === SessionEndType.CANCEL_ORDER || cancelOrderEvent === SessionEndType.APP_TIMEOUT) {
      return RecoOrderState.CANCELLED;
    } else if (cancelOrderEvent === SessionEndType.ORDER_FAIL) {
      return RecoOrderState.PAYMENT_FAILED;
    } else if (cancelOrderEvent === SessionEndType.ORDER_SUCCESS) {
      return RecoOrderState.PAID;
    }
  }

  public mapPaymentTypeToReco(paymentType: PAYMENT_TYPE) {
    if (paymentType === PAYMENT_TYPE.CARD) {
      return RecoPaymentMethod.CARD;
    } else if (paymentType === PAYMENT_TYPE.CASH) {
      return RecoPaymentMethod.CASH;
    } else {
      return RecoPaymentMethod.CUSTOM;
    }
  }

  public buildUpdatePayloadBasedOnCancelEvent(cancelEvent: SessionEndType, basketTotal: number, paymentType: PAYMENT_TYPE, orderIdentifier: number) {
    const updatePayload: UpdateOrderOptions = {
        orderId: orderIdentifier,
        payload: {},
      };

    if (cancelEvent === SessionEndType.CANCEL_ORDER || cancelEvent === SessionEndType.APP_TIMEOUT) {
      (updatePayload.payload.abortMethod = RecoAbortMethodEnum.MANUAL),
        (updatePayload.payload.abortDate = new Date()),
        (updatePayload.payload.state = this.mapCancelOrderEventToReco(cancelEvent));
    } else if (cancelEvent === SessionEndType.ORDER_FAIL || cancelEvent === SessionEndType.ORDER_SUCCESS) {
      updatePayload.payload = {
        state: this.mapCancelOrderEventToReco(cancelEvent),
        paymentMethod: this.mapPaymentTypeToReco(paymentType),
        paymentDate: new Date(),
        paidAmount: basketTotal,
        taxesAmount: 0,
      };
    }

    return updatePayload;
  }

  public updateOrderForReco(payload: UpdateOrderOptions) {
    return RecommendationsService.getInstance().updateOrder(payload, this.recoCallsTimeout);
  }

  public createOrUpdateItemForOrder(button: DotButton): Promise<UpdateItemResponse> {
    return RecommendationsService.getInstance().createOrUpdateItemForOrder({
      orderId: this.recoOrder.id,
      payload: {
        productId: button.Link,
        productType: button.ButtonType,
        quantity: button.quantity,
        additionalData: button['additionalData']
      }
    }, this.recoCallsTimeout);
  }

  /**
   * Updates an Reco Oreder item for the Reco Order.
   * If no Reco Order then creates one first
   */
  public safeCreateOrUpdateItemForOrder(button: DotButton): Promise<UpdateItemResponse> {
    return new Promise((resolve, reject) => {
      if (!!this.recoOrder) {
        this.createOrUpdateItemForOrder(button).then(updateItemResponse => {
          resolve(updateItemResponse);
        }).catch(e => {
          reject(e);
        });
      } else {
        this.createOrderForReco().then(recoOrder => {
          this.recoOrder = recoOrder;
          this.createOrUpdateItemForOrder(button).then(updateItemResponse => {
            resolve(updateItemResponse);
          }).catch(e => {
            reject(e);
          });
        }).catch(e => {
          reject(e);
        });
      }
    });
  }

}
