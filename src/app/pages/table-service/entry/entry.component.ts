import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { isAdaEnabled } from '@dotxix/helpers';
import { EndSceneRoutingService } from '@dotxix/services';

@Component({
  selector: 'acr-entry',
  templateUrl: './entry.component.html',
})
export class TableServiceEntryComponent {
  public isAdaEnabled = isAdaEnabled;

  constructor(protected router: Router, protected endSceneRouterService: EndSceneRoutingService) {}

  public cancel() {
    this.endSceneRouterService.goToEndScene();
  }

  public goToSelection() {
    this.router.navigate(['ts-selection']);
  }
}
