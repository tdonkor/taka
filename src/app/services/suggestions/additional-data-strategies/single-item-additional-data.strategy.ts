import { DotButton } from "dotsdk";
import { AdditionalDataModel } from "../models/additional-data.model";
import { AdditionalDataStrategy } from "./addition-data.strategy";

export class SingleItemAdditionalDataStrategy implements AdditionalDataStrategy {
  buildAdditionalData(button: DotButton): AdditionalDataModel {
    const additionalData: AdditionalDataModel = {
      combo: null,
      modifiers: []
    }
    return additionalData;
  }
}