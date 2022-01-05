export enum PROMOS_STATE {
  START = 'start',
  SCAN = 'scan',
  KEYBOARD = 'keyboard',
  PROMOS_ERROR = 'promos_error',
  VALID_PROMOS = 'valid_promos'
}

export enum PromoDiscountsMode {
  FULL_DISCOUNT = 'FullDiscount',
  EXCLUDE_PRICED_ITEMS = 'ExcludePricedItems',
  EXCLUDE_ONLY_PRICED_MODIFIERS = 'ExcludeOnlyPricedModifiers'
}

export enum PromoResponseType {
  ORDER_DISCOUNT = 0,
  PROMO_NODE = 1,
  PROMO_ERROR = 2
}
