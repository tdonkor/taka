import { DotButton } from "dotsdk";
import { AdditionalDataModel } from "../models/additional-data.model";
import { AdditionalDataStrategy } from "./addition-data.strategy";

export class SingleItemWithModifiersStrategy implements AdditionalDataStrategy {
  buildAdditionalData(button: DotButton): AdditionalDataModel {
    const additionalData: AdditionalDataModel = {
      combo: null,
      modifiers: button.ModifiersPage.Modifiers
    }
    return additionalData;
  }

}