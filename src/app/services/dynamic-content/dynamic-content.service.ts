import {
  Injectable,
  Type,
  ComponentFactoryResolver,
  ApplicationRef,
  Injector,
  EmbeddedViewRef,
  ComponentRef,
  RendererFactory2,
} from '@angular/core';
import { Subject } from 'rxjs';
import { AbstractDynamicComponent } from './models/abstract-dynamic.component';
import { DynamicContentRef } from './models/dynamic-content.ref';
import { DynamicContentParams } from './models/dynamic-content.params';

@Injectable({
  providedIn: 'root',
})
export class DynamicContentService {
  protected openedDialog: DynamicContentRef;
  protected dialogComponentRef: ComponentRef<AbstractDynamicComponent>;
  protected _contentControlsClick: Subject<any> = new Subject();
  protected openDialogs: DynamicContentRef[] = [];

  constructor(
    protected componentFactoryResolver: ComponentFactoryResolver,
    protected injector: Injector,
    protected rendererFactory: RendererFactory2
  ) {}

  public get appRef(): ApplicationRef {
    const _appRef = this.injector.get(ApplicationRef);
    return _appRef;
  }

  public openContent(componentClass: Type<AbstractDynamicComponent>, config: DynamicContentParams): DynamicContentRef {
    const dialogRef = this._attachDialogContent(componentClass, config);
    this.openedDialog = dialogRef;
    this.openDialogs.push(dialogRef);
    dialogRef.afterClosed.subscribe(() => this._removeDialog(dialogRef));
    return dialogRef;
  }

  public closeAllDialogs() {
    let i = this.openDialogs.length;
    while (i--) {
      this.openDialogs[i].close();
    }
  }

  public closeContent() {
    this.openedDialog.close();
  }

  protected _createInjector(dynamicContentRef: DynamicContentRef, config: DynamicContentParams, injector: Injector = null) {
    const injectionTokens = [
      { provide: DynamicContentParams, useValue: config },
      { provide: DynamicContentRef, useValue: dynamicContentRef },
    ];
    // tslint:disable-next-line: no-use-before-declare
    return Injector.create({ parent: injector || this.injector, providers: injectionTokens });
  }

  private _attachDialogContent(componentClass: Type<AbstractDynamicComponent>, config: DynamicContentParams): DynamicContentRef {
    const dialogRef = new DynamicContentRef(this.appRef);
    const injector = this._createInjector(dialogRef, config);
    const cmpRef = this._createAndAttachComponent(injector, componentClass);
    dialogRef.componentInstance = cmpRef;
    if (config.cssClass) {
      const renderer = this.rendererFactory.createRenderer(null, null);
      config.cssClass.split(' ').forEach((css) => renderer.addClass(cmpRef.location.nativeElement, css));
    }

    this._attachToDOM(cmpRef.hostView as EmbeddedViewRef<any>);
    return dialogRef;
  }

  private _createAndAttachComponent(
    injector: Injector,
    componentType: Type<AbstractDynamicComponent>
  ): ComponentRef<AbstractDynamicComponent> {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
    const componentRef = componentFactory.create(injector);
    this.appRef.attachView(componentRef.hostView);

    return componentRef;
  }

  private _attachToDOM(hostView: EmbeddedViewRef<any>): void {
    const domElem = hostView.rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);
  }

  private _removeDialog(dialogRef: DynamicContentRef): void {
    const index = this.openDialogs.indexOf(dialogRef);

    if (index > -1) {
      this.openDialogs.splice(index, 1);
    }
    dialogRef = null;
  }
}
