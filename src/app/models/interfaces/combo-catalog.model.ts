import { BaseModel, DotButton, mapArrayModelsToArrayInstances } from 'dotsdk';

export class CombosCatalog extends BaseModel {
  public Buttons: DotButton[];
  constructor(input?: any) {
    super(input);
    this.Buttons = mapArrayModelsToArrayInstances(input.Buttons, DotButton);
  }
}
