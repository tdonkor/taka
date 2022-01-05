import { DotButton } from "dotsdk";
import { SuggestionStrategyEnum } from "../enums/suggestion-strategy.enum";
import { AdditionalDataModel } from "../models/additional-data.model";
import { SuggestionsSaleService } from "../suggestions-sale.service";
import { AdditionalDataStrategy } from "./addition-data.strategy";


export class RecommendedSingleItemAdditionalDataStrategy implements AdditionalDataStrategy {
  buildAdditionalData(button: DotButton,recommendationMode:SuggestionStrategyEnum): AdditionalDataModel {
    const suggestionsSaleService = new SuggestionsSaleService();
    const additionalData: AdditionalDataModel = {
      combo: null,
      modifiers: [],
      recommendationMode: recommendationMode,
      recommendationView: button["recommendationView"]
    };
    return additionalData;
  }

}