import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { isAdaEnabled } from '@dotxix/helpers';
import { PosElogHandler } from 'dotsdk';

@Component({
  selector: 'acr-preorder',
  templateUrl: './preorder.component.html',
})
export class PreorderComponent implements AfterViewInit {
  public isAdaEnabled = isAdaEnabled;

  public get isTableServiceActive(): boolean {
    return !!PosElogHandler.getInstance().posConfig.posHeader?.cvars?.TS_No;
  }

  constructor(protected router: Router) {}

  public ngAfterViewInit() {
    setTimeout(() => {
      this.router.navigate(['order-number']);
    }, 4000);
  }
}
