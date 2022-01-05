import { BaseModel } from 'dotsdk';
import { Subject } from 'rxjs';

export abstract class AbstractDynamicComponent {
  public dialogText: string;
  protected _componentControlsClick: Subject<any> = new Subject();
  protected _content: BaseModel | BaseModel[];

  public get componentControlsClick() {
    return this._componentControlsClick.asObservable();
  }

  public set content(value: BaseModel | BaseModel[]) {
    this._content = value;
  }
}
