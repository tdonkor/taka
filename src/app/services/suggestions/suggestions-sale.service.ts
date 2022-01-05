import { Injectable } from '@angular/core';
import { RecoEngineRandomizer } from '../suggestions/reco-engine-randomizer/reco-engine-randomizer';
import { SuggestionStrategyInterface } from '../suggestions/strategies/abstract/suggestions-strategy.interface';
import { SuggestionStrategyResolver } from './suggestion-strategy-resolver';
import { RecommendationService } from '../suggestions/recommendation-service';

@Injectable({ providedIn: 'root' })
export class SuggestionsSaleService {
  public strategyInstance: SuggestionStrategyInterface;

  constructor() {}

  public determineSuggestionsStrategy(recoService: RecommendationService): SuggestionStrategyInterface {
    // TODO: remove after random selection is implemented
    // const suggestionStrategy: SuggestionStrategyEnum = SuggestionStrategyEnum.CLOUD_ENGINE;
    const suggestionStrategy: any = RecoEngineRandomizer.pickRandom();
    const suggestionStrategyResolver = new SuggestionStrategyResolver(suggestionStrategy, recoService);
    this.strategyInstance = suggestionStrategyResolver.getStrategy();
    return this.strategyInstance;
  }
}
