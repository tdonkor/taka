import { AtpApplicationSettings, logManager } from 'dotsdk';
import { SuggestionStrategyEnum } from '../enums/suggestion-strategy.enum';
import { BK_RECOMMENDATIONS_LOGGER_NAME } from './bk-reco-engine-logger-name';

export class RecoEngineRandomizer {
  private static logger = logManager.getLogger(BK_RECOMMENDATIONS_LOGGER_NAME);
  public static pickRandom(): SuggestionStrategyEnum {
    const options: SuggestionStrategyEnum[] = RecoEngineRandomizer.recommendationEnabledModes;
    const pickingRange = [0, options.length - 1];
    const pickedIndex = RecoEngineRandomizer.getRandomFromRangeInclusive(pickingRange);
    const pickedOption: SuggestionStrategyEnum = options[pickedIndex];
    return pickedOption;
  }

  private static getRandomFromRangeInclusive = ([min, max]: number[]) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static get recommendationEnabledModes(): SuggestionStrategyEnum[] {
    let recommendationEnabledModes: SuggestionStrategyEnum[] =
      AtpApplicationSettings.getInstance().bundleSettingsJson.recommendationEnabledModes;
    if (
      !Array.isArray(recommendationEnabledModes) ||
      (Array.isArray(recommendationEnabledModes) &&
      !recommendationEnabledModes.length)
    ) {
      recommendationEnabledModes = [SuggestionStrategyEnum.KIOSK_BUILDER];
      RecoEngineRandomizer.logger.warn(
        'Bundle Setting: recommendationEnabledModes must be of type MULTISELECT and must have at least one option selected. Default will be used: ["KIOSK_BUILDER"]'
      );
    }
    return recommendationEnabledModes;
  }
}
