import { Injectable } from '@angular/core';
import { DotButton, DotCombo } from 'dotsdk';

@Injectable({ providedIn: 'root' })
export class ComboStepperService {
  public content: DotButton;

  public getCurrentComboStep(ComboStepID: string): DotCombo {
    return this.content.ComboPage.Combos.find(
      (combo) => combo.ComboStepID === ComboStepID
    );
  }

  public getCombosFromCurrentComboStep(
    dotCombo: DotCombo,
    button: DotButton
  ): DotCombo[] {
    return [...dotCombo.Buttons].find((btn) => btn.Link === button.Link).ComboPage.Combos;
  }
}
