
export enum HomeButtonDisplayType {
  DO_NOT_DISPLAY = 'DO_NOT_DISPLAY',
  DISPLAY_DOCKED = 'DISPLAY_DOCKED',
  DISPLAY_SCROLL = 'DISPLAY_SCROLL'
}
export enum TableServiceType {
  DISABLED = 'DISABLED',
  EAT_IN = 'EAT_IN',
  TAKE_OUT = 'TAKE_OUT',
  BOTH = 'BOTH'
}
export enum NutritionalInformationDisplayType {
  DO_NOT_DISPLAY = 'DO_NOT_DISPLAY',
  ONLY_CALORIES = 'ONLY_CALORIES',
  ONLY_ALLERGENS = 'ONLY_ALLERGENS',
  ALL = '*'
}
export enum PromoInputOption {
  BOTH = 'BOTH',
  KEYBOARD = 'DIGITAL_KEYBOARD',
  SCANNER = 'SCANNER'
}

export enum InventoryStatus {
  OK = 0,
  NOK = 1,
  NEAR = 2
}
export enum KioskStatusColor {
  RED = 'red',
  ORANGE = 'orange',
  BLUE = 'blue',
  PURPLE = 'purple',
  NO_COLOR = 'no_color'
}

export enum ProductStatus {
  AVAILABLE = 1,
  UNAVAILABLE = 2
}

export enum LinkToParentStatus {
  LINKED = '1',
  UNLINKED = '0'
}
