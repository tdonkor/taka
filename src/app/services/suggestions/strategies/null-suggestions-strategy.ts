import { DotButton, DotPage } from 'dotsdk';
import { SuggestionStrategyEnum } from '../enums/suggestion-strategy.enum';
import { SuggestionType } from '../models/suggestion-type.enum';
import { SuggestionStrategyInterface } from './abstract/suggestions-strategy.interface';

export class NullSuggestionsStrategy implements SuggestionStrategyInterface {
  public recommendationMode =  SuggestionStrategyEnum.NONE;
  public getSuggestions(type: SuggestionType, itemId?: string): Promise<DotPage[]> {
    return Promise.resolve([]);
  }
  public getPopularSuggestion(): Promise<DotButton[]> {
    return Promise.resolve([]);
  }
  public getBasketSuggestion(itemId: any): Promise<DotPage[]> {
    return Promise.resolve([]);
  }
}
