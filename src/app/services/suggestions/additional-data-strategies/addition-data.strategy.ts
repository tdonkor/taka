import { DotButton } from "dotsdk";
import { SuggestionStrategyEnum } from "../enums/suggestion-strategy.enum";
import { AdditionalDataModel } from "../models/additional-data.model";

export interface AdditionalDataStrategy {
    buildAdditionalData(button: DotButton,recommendationMode?: SuggestionStrategyEnum): AdditionalDataModel;
}