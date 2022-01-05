import { DotButton, DotCombo } from "dotsdk";
import { AdditionalDataModel } from "../models/additional-data.model";
import { AdditionalDataStrategy } from "./addition-data.strategy";

export class ComboAdditionalDataStrategy implements AdditionalDataStrategy {
  buildAdditionalData(button: DotButton): AdditionalDataModel {
    const additionalData: AdditionalDataModel = {
      combo: this.mapComboStepToComboAdditionalData(button.ComboPage.Combos),
      modifiers: [],
    };
    return additionalData;
  }

  mapComboStepToComboAdditionalData(combos: DotCombo[]) {
    const combosForAdditionalData = combos.map((combo) => {
      return {
        name: combo.ComboStepName,
        items: combo.Buttons.map((btn) => { return { name: btn.Caption, id: btn.Link, quantity: btn.quantity, selected: btn.Selected ,modifiers:btn.ModifiersPage?.Modifiers } })
      }
    });
    return combosForAdditionalData;
  }


}