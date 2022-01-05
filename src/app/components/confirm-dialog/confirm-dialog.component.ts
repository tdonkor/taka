import { Component, OnInit } from '@angular/core';
import { Animations } from '../../animation/animation';
import { AbstractDynamicComponent } from '../../services/dynamic-content/models/abstract-dynamic.component';
import { DynamicContentParams } from '../../services/dynamic-content/models/dynamic-content.params';
import { DynamicContentRef } from '../../services/dynamic-content/models/dynamic-content.ref';

import { DotButton } from 'dotsdk';

@Component({
  selector: 'acr-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
})
export class ConfirmDialogComponent extends AbstractDynamicComponent implements OnInit {
  public exitAnimation = false;

  constructor(private data: DynamicContentParams, private dynamicContentRef: DynamicContentRef) {
    super();
  }

  public ngOnInit(): void {}

  public get title(): string {
    return this.data.title;
  }
  public get button(): DotButton {
    return this.data.button;
  }

  public get leftButtonText(): string {
    return this.data.leftButtonText;
  }

  public get rightButtonText(): string {
    return this.data.rightButtonText;
  }

  public onControlsButtonsClick(buttonType: string): void {
    this.exitAnimation = true;
    setTimeout(() => this.dynamicContentRef.close(buttonType), 500);
  }
}
