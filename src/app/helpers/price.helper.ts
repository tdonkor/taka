import { DotButton, PosServingLocation, calculateButtonPrice } from 'dotsdk';

export function price(button: DotButton, serviceLocation: PosServingLocation): number {
    if (button.hasCombos) {
        return button.MinPrice;
    }
    if (button.Page && button.MinPrice && button.MinPrice !== null && button.MinPrice !== 0) {
        return button.MinPrice;
    }
    return calculateButtonPrice(button, serviceLocation);
}
