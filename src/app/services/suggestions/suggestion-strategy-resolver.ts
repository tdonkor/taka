
import { RecommendationService } from '../suggestions/recommendation-service';
import { SuggestionStrategyEnum } from '../suggestions/enums/suggestion-strategy.enum';
import { SuggestionStrategyInterface } from '../suggestions/strategies/abstract/suggestions-strategy.interface';
import { CloudEngineSuggestionsStrategy } from './cloud-engine-suggestions-strategy';
import { KioskBuilderSuggestionsStrategy } from '../suggestions/strategies/kiosk-builder-suggestions-strategy';
import { NullSuggestionsStrategy } from '../suggestions/strategies/null-suggestions-strategy';

export class SuggestionStrategyResolver {
  constructor(private strategy: SuggestionStrategyEnum, private recoService: RecommendationService) {}

  public getStrategy(): SuggestionStrategyInterface {
    switch (this.strategy) {
      case SuggestionStrategyEnum.CLOUD_ENGINE:
        return new CloudEngineSuggestionsStrategy(this.recoService);
      case SuggestionStrategyEnum.KIOSK_BUILDER:
        return new KioskBuilderSuggestionsStrategy();
      case SuggestionStrategyEnum.NONE:
        return new NullSuggestionsStrategy();
    }
  }
}
