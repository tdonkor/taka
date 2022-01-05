import { AutoPopFeatMode } from '../models';
import { DotModifier } from 'dotsdk';

export function isAutoPopFeatVisible(modifier: DotModifier, onOrder: boolean, isItem: boolean): boolean {
  switch (modifier.PageInfo.AutoPopFeat) {
    case AutoPopFeatMode.NOT_POP_ON_ORDER_POP_ON_MODIFY:
      return !onOrder;
    case AutoPopFeatMode.POP_ON_ORDER_POP_ON_MODIFY:
      return true;
    case AutoPopFeatMode.POP_ON_ORDER_NOT_POP_ON_MODIFY:
      return onOrder;
    case AutoPopFeatMode.NOT_POP_ON_ORDER_NOT_POP_ON_MODIFY:
      return false;
    case AutoPopFeatMode.POP_ON_ORDER_ITEMS_NOT_POP_ON_ORDER_COMBOS_POP_ON_MODIFY:
      return !(onOrder && !isItem);
    case AutoPopFeatMode.POP_ON_COMBOS_NOT_POP_ON_ITEMS:
      return !isItem;
  }
  return false;
}
