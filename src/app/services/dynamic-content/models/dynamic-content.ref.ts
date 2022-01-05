import { ApplicationRef, ComponentRef } from '@angular/core';

import { Subject } from 'rxjs';

export class DynamicContentRef {
  public componentInstance: ComponentRef<any>;

  private _afterClosed = new Subject<any>();
  // private _result: any;

  public get afterClosed() {
    return this._afterClosed.asObservable();
  }

  // TODO: to take into account a viewContainerRef in the future
  constructor(private applicationRef: ApplicationRef) {}

  public close(result: any = null) {
    // this._result = result;
    this.applicationRef.detachView(this.componentInstance.hostView);
    this.componentInstance.destroy();
    this.componentInstance = null;
    this._afterClosed.next(result);
  }
}
