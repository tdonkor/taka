import { Component, ViewEncapsulation } from '@angular/core';
import { Animations } from '@dotxix/animation';
import { AbstractDynamicComponent, AllergensService, DynamicContentRef } from '@dotxix/services';
import { DotAllergen } from 'dotsdk';

@Component({
  selector: 'acr-allergen-selection',
  templateUrl: './allergen-selection.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: [Animations.popupIn, Animations.popupOut],
})
export class AllergenSelectionComponent extends AbstractDynamicComponent {
  public supportedAllergenIcons: string[] = [
    'CEL',
    'EGG',
    'FIS',
    'LUP',
    'MIL',
    'MOL',
    'MUS',
    'NUT',
    'PEA',
    'SES',
    'SHE',
    'SOY',
    'SUL',
    'WHE',
  ];
  public displayTabbedContent = false;
  public exitAnimation = false;

  public get allergens() {
    return this.allergensService.allergens.filter((a) => !a.Name.includes('_m'));
  }

  constructor(private dynamicContentRef: DynamicContentRef, private allergensService: AllergensService) {
    super();
  }

  public isAllergenIconAvailable(allergen: DotAllergen): boolean {
    return this.supportedAllergenIcons.includes(allergen.Name);
  }

  public isAllergenSelected(allergen: DotAllergen): boolean {
    return this.allergensService.selectedAllergens.some((a) => a.Name === allergen.Name);
  }

  public resetFilterClick() {
    this.allergensService.resetAllergens();
  }
  public closeClick() {
    this.exitAnimation = true;
    setTimeout(() => this.dynamicContentRef.close(), 350);
  }

  public allergensClick(allergen: DotAllergen) {
    if (this.allergensService.selectedAllergens.some((a) => a.Name === allergen.Name)) {
      this.allergensService.removeAllergen(allergen);
    } else {
      this.allergensService.addAllergen(allergen);
    }
  }
  public tabbedContentClick() {
    this.displayTabbedContent = !this.displayTabbedContent;
  }
}
