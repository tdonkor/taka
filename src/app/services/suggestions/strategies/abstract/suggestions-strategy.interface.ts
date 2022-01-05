import { SuggestionStrategyEnum } from '../../enums/suggestion-strategy.enum';
import { DotButton, DotPage } from 'dotsdk';
import { SuggestionType } from '../../models/suggestion-type.enum';

export interface SuggestionStrategyInterface {
  recommendationMode: SuggestionStrategyEnum;
  getSuggestions(type: SuggestionType, itemId?: any): Promise<DotPage[]>;
  getPopularSuggestion(): Promise<DotButton[]>;
  getBasketSuggestion(itemId: any): Promise<DotPage[]>;
}
