import { DotButton, DotPage, RecommendationsService } from 'dotsdk';
import { SuggestionStrategyEnum } from './enums/suggestion-strategy.enum';
import { SuggestionType } from './models/suggestion-type.enum';
import { SuggestionStrategyInterface } from './strategies/abstract/suggestions-strategy.interface';
import * as _ from 'lodash';
import { RecommendationsView } from './models/recommendation-view.enum';
import { RecommendationService } from './recommendation-service';

export class CloudEngineSuggestionsStrategy implements SuggestionStrategyInterface {
  public recommendationMode = SuggestionStrategyEnum.CLOUD_ENGINE;

  constructor(private recoOrderService: RecommendationService) {}

  public async getSuggestions(type: SuggestionType, itemId?: string): Promise<DotPage[]> {
    if (!this.recoOrderService.recoOrder) {
      return Promise.resolve([]);
    }
    const orderId = this.recoOrderService.recoOrder.id;

    if (type === SuggestionType.ORDER_SUGGESTION) {
      return Promise.resolve([]);
    }
    let response: DotPage[];
    try {
      const recommendationPage = await RecommendationsService.getInstance()
        .getRecommendedForOrder(orderId, 6, this.recoOrderService.recoCallsTimeout)
        .catch((e) => Promise.reject(e));
      recommendationPage.Buttons.forEach((btn) => {
        btn['recommendationView'] = RecommendationsView.MODALPOPUP;
      });

      if (recommendationPage?.Buttons?.length === 0) {
        response = [];
      } else {
        response = [recommendationPage];
      }
    } catch (e) {
      response = [];
    }

    return response;
  }
  public async getPopularSuggestion(): Promise<DotButton[]> {
    let response: DotButton[];
    try {
      const dotPage = await RecommendationsService.getInstance()
        .getPopularsForStore(3, this.recoOrderService.recoCallsTimeout)
        .catch((e) => Promise.reject(e));
      dotPage.Buttons.forEach((btn) => {
        btn['recommendationView'] = RecommendationsView.HOME;
      });
      response = dotPage.Buttons;
    } catch (e) {
      response = [];
    }

    return response;
  }
  public async getBasketSuggestion(itemId: any): Promise<DotPage[]> {
    let response: DotPage[];
    try {
      response = _.cloneDeep([
        await RecommendationsService.getInstance().getRecommendedForOrder(itemId, 1, this.recoOrderService.recoCallsTimeout),
      ]);
      response[0].Buttons.forEach((btn) => {
        btn['recommendationView'] = RecommendationsView.BASKET;
      });
    } catch (e) {
      response = [];
    }
    return response;
  }
}
