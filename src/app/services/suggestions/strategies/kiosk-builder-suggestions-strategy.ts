import { DotButton, DotPage, DotSuggestionSalesService } from 'dotsdk';
import { SuggestionStrategyEnum } from '../enums/suggestion-strategy.enum';
import { SuggestionType } from '../models/suggestion-type.enum';
import { SuggestionStrategyInterface } from './abstract/suggestions-strategy.interface';
import * as _ from 'lodash';
import { RecommendationsView } from '../models/recommendation-view.enum';

export class KioskBuilderSuggestionsStrategy implements SuggestionStrategyInterface {
  public recommendationMode = SuggestionStrategyEnum.KIOSK_BUILDER;
  public getSuggestions(type: SuggestionType, itemId?: string): Promise<DotPage[]> {
    let resultPages: DotPage[] = [];
    if (type === SuggestionType.ITEM_SUGGESTION) {
      if (!itemId) {
        return Promise.reject('You need to pass an item id in order to retrieve Item Suggestions');
      }
      resultPages = DotSuggestionSalesService.getInstance().getButtonSuggestionByLink(itemId);
    }

    if (type === SuggestionType.COMBO_SUGGESTION) {
      if (!itemId) {
        return Promise.reject('You need to pass an item id in order to retrieve Combo Suggestions');
      }
      resultPages = DotSuggestionSalesService.getInstance().getComboSuggestionsByLink(itemId);
    }

    if (type === SuggestionType.ORDER_SUGGESTION) {
      resultPages = DotSuggestionSalesService.getInstance().getOrderSuggestions();
    }

    if (resultPages) {
      resultPages = _.cloneDeep(resultPages) as DotPage[];
      resultPages.forEach((page) => {
        page.Buttons.forEach((btn) => {
          btn['recommendationView'] = RecommendationsView.MODALPOPUP;
        });
      });
    }

    return Promise.resolve(resultPages);
  }
  public getPopularSuggestion(): Promise<DotButton[]> {
    return Promise.resolve([]);
  }
  public getBasketSuggestion(itemId: any): Promise<DotPage[]> {
    return Promise.resolve([]);
  }
}
