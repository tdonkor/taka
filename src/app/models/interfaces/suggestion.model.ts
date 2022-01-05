import * as _ from 'lodash';

import { DotPage } from 'dotsdk';

export class Suggestion {
  private _suggestionPages: DotPage[];
  private _currentIndex = 0;
  private _parentLinkUUID: string;

  public get suggestionPages(): DotPage[] {
    return this._suggestionPages;
  }
  public get currentSuggestionPage(): DotPage {
    return this._suggestionPages[this._currentIndex];
  }
  public get parentLinkUUID(): string {
    return this._parentLinkUUID;
  }
  public get isLastPage(): boolean {
    return this._currentIndex === this._suggestionPages.length - 1;
  }

  constructor(suggestionPages: DotPage[], parentLinkUUID: string = null) {
    this._suggestionPages = _.cloneDeep(suggestionPages);
    this._parentLinkUUID = parentLinkUUID;
  }

  public next(): DotPage | null {
    if (this._currentIndex < this._suggestionPages.length - 1) {
      this._currentIndex++;
      return this.currentSuggestionPage;
    } else {
      return null;
    }
  }
  public back(): DotPage | null {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      return this.currentSuggestionPage;
    } else {
      return null;
    }
  }
}
