import { DotModifier } from "dotsdk";

export class AdditionalDataCombo{
    public name: string;
    public items: AdditionalDataComboItem[];
}

export class AdditionalDataComboItem{
  public name:string;
  public id: string;
  public quantity: number;
  public selected:boolean;
  public modifiers:DotModifier[];
}