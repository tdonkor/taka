import { DotModifier } from "dotsdk";
import { SuggestionStrategyEnum } from "../enums/suggestion-strategy.enum";
import { AdditionalDataCombo } from "./additional-data-combo.model";
import { RecommendationsView } from "./recommendation-view.enum";

export class AdditionalDataModel{
    public recommendationMode?: SuggestionStrategyEnum;
    public recommendationView?: RecommendationsView;
    public combo:AdditionalDataCombo[];
    public modifiers:DotModifier[];
}