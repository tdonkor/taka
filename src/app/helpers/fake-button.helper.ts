import { DotButton } from 'dotsdk';

export function createFakeButton() {
  return new DotButton({
    ComboPage: null,
    ModifiersPage: null,
    Page: null,
    Scoring: null,
    SuggestivePages: [],
    Replacing: [],
    Avlb: null
  });
}
