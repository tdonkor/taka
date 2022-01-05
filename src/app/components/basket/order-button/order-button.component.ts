import { Component, OnInit } from '@angular/core';
import { BasketComponent } from '../basket.component';
import { DotCdkTranslatePipe } from '../../../pipes/dot-translate.pipe';
import { BasketService } from '../../../services/basket.service';
import { DynamicContentService } from '../../../services/dynamic-content/dynamic-content.service';
import { DotButton } from 'dotsdk';

@Component({
  selector: 'acr-order-button',
  templateUrl: './order-button.component.html',
})
export class OrderButtonComponent implements OnInit {
  constructor(
    private basketService: BasketService,
    protected translatePipe: DotCdkTranslatePipe,
    protected dynamicContentService: DynamicContentService
  ) {}

  public ngOnInit(): void {}

  public get basketButtons(): DotButton[] {
    return this.basketService.buttons;
  }

  public get basketTitle(): string {
    if (this.basketButtonLength === 0) {
      return this.translatePipe.transform('6');
    }

    if (this.basketButtonLength === 1) {
      return this.translatePipe.transform('19');
    }

    return this.translatePipe.transform('92');
  }

  public get basketButtonLength(): number {
    return this.basketService.getQuantityButtons();
  }

  public basketToggle(): void {
    this.basketService.basketToggle(BasketComponent);
  }
}
