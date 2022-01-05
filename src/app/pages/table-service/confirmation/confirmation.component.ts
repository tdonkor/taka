import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { isAdaEnabled } from '@dotxix/helpers';

@Component({
  selector: 'acr-table-service-confirmation',
  templateUrl: './confirmation.component.html',
})
export class TableServiceConfirmationComponent implements AfterViewInit {
  public isAdaEnabled = isAdaEnabled;

  constructor(protected router: Router) {}

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.router.navigate(['order-number']);
    }, 4000);
  }
}
