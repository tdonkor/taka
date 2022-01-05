import { Component, Input } from '@angular/core';
@Component({
  selector: 'acr-checkout-loading',
  templateUrl: 'loading.component.html'
})
export class LoadingComponent {
  @Input() public waitingMessage: any;
  @Input() public waitingMessage2: any;
  constructor() {}
}
