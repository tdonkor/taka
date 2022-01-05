import { Injectable } from '@angular/core';
import { DotAllergensLoader, DotAllergen } from 'dotsdk';
import { DynamicContentService } from './dynamic-content/dynamic-content.service';

@Injectable({
  providedIn: 'root'
})
export class AllergensService {

  protected _allergens: DotAllergen[] = [];
  protected _selectedAllergens: DotAllergen[] = [];

  public get selectedAllergens(): DotAllergen[] {
    return this._selectedAllergens;
  }
  public get allergens(): DotAllergen[] {
    return this._allergens || [];
  }

  constructor(protected dynamicContentService: DynamicContentService) {
    this._allergens = DotAllergensLoader.getInstance().loadedModel.Allergens;
  }

  public addAllergen(allergen: DotAllergen) {
    this._selectedAllergens.push(allergen);
  }
  public removeAllergen(allergen: DotAllergen) {
    this._selectedAllergens = this._selectedAllergens.filter(a => a.Name !== allergen.Name);
  }
  public resetAllergens() {
    this._selectedAllergens = [];
  }
}
