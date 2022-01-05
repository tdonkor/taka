import { SuggestionStrategyEnum } from '../enums/suggestion-strategy.enum';
import { NullSuggestionsStrategy } from '../strategies/null-suggestions-strategy';
import { KioskBuilderSuggestionsStrategy } from '../strategies/kiosk-builder-suggestions-strategy';
import { CloudEngineSuggestionsStrategy } from '../cloud-engine-suggestions-strategy';
import { SuggestionStrategyResolver } from '../suggestion-strategy-resolver';
import { RecommendationService } from '../recommendation-service';
import { SuggestionsSaleService } from '../suggestions-sale.service';

fdescribe('SuggestionStrategyResolver', () => {
  it('should create an instance of SuggestionStrategyResolver', () => {
    const strategyResolver = new SuggestionStrategyResolver(SuggestionStrategyEnum.NONE, null);
    expect(strategyResolver).toBeDefined();
  });
  it('should resolve a NullSuggestionStrategy', () => {
    const strategyResolver = new SuggestionStrategyResolver(SuggestionStrategyEnum.NONE, null);
    const suggestionStrategy = strategyResolver.getStrategy();
    expect(suggestionStrategy instanceof NullSuggestionsStrategy).toBeTruthy();
  });
  it('should resolve a KioskBuilderSuggestionStrategy', () => {
    const strategyResolver = new SuggestionStrategyResolver(SuggestionStrategyEnum.KIOSK_BUILDER, null);
    const suggestionStrategy = strategyResolver.getStrategy();
    expect(suggestionStrategy instanceof KioskBuilderSuggestionsStrategy).toBeTruthy();
  });
  it('should resolve a CloudEngineSuggestionStrategy', () => {
    const suggestionService = new SuggestionsSaleService();
    const recoService = new RecommendationService(suggestionService);
    const strategyResolver = new SuggestionStrategyResolver(SuggestionStrategyEnum.CLOUD_ENGINE, recoService);
    const suggestionStrategy = strategyResolver.getStrategy();
    expect(suggestionStrategy instanceof CloudEngineSuggestionsStrategy).toBeTruthy();
  });
});
