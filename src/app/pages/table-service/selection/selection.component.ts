import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { isAdaEnabled } from '@dotxix/helpers';
import { ApplicationSettingsService, BasketService, EndSceneRoutingService, StatusService } from '@dotxix/services';
import { PosElogHandler, DotButton, getCatalogButton } from 'dotsdk';

@Component({
  selector: 'acr-table-service-selection',
  templateUrl: './selection.component.html',
})
export class TableServiceSelectionComponent {
  public isAdaEnabled = isAdaEnabled;
  public tableServiceNumber = '';

  public get disableConfirmButton(): boolean {
    return this.tableServiceNumber.length < 1;
  }

  public get tableServiceNumberPrefix(): string {
    return this.appSettingsService.tableServiceNumberPrefix
      ? `${this.appSettingsService.tableServiceNumberPrefix} ${this.tableServiceNumber}`
      : this.tableServiceNumber;
  }

  private get tableServiceItem(): DotButton | null {
    if (this.appSettingsService.tableServiceItem) {
      
      const catalogButton = getCatalogButton(this.appSettingsService.tableServiceItem);
      return catalogButton || null;
    }
  }

  constructor(
    protected router: Router,
    protected statusService: StatusService,
    protected appSettingsService: ApplicationSettingsService,
    protected endSceneRouting: EndSceneRoutingService,
    protected basketService: BasketService
  ) {}

  public updateTableServiceNumber(inputValue: string) {
    this.tableServiceNumber = inputValue;
  }

  public confirmTableServiceNumber() {
    if (typeof PosElogHandler.getInstance().posConfig.posHeader.cvars === 'object') {
      PosElogHandler.getInstance().posConfig.posHeader.cvars.TS_No = this.tableServiceNumberPrefix;
      PosElogHandler.getInstance().posConfig.posHeader.cvars.TableService = 4;
    } else {
      PosElogHandler.getInstance().posConfig.posHeader.cvars = {
        TS_No: this.tableServiceNumberPrefix,
        TableService: 4,
      };
    }

    if (this.tableServiceItem) {
      this.basketService.addButtonToBasket(this.tableServiceItem);
      PosElogHandler.getInstance().posConfig.posHeader.cvars.TS_Element = this.tableServiceItem.Link;
    }

    this.endSceneRouting.goToEndScene();
  }

  public cancel() {
    this.endSceneRouting.goToEndScene();
  }
}
