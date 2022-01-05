import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';

interface Key {
  type: 'text' | 'backspace' | 'number' | 'empty' | 'blank' | 'clear';
  value: string;
}
interface Keyboard {
  name: string;
  layout: Key[][];
}

const textKeyboard: Keyboard = {
  name: 'text',
  layout: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(_ => (<Key> { type: 'number', value: _ })),
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(_ => (<Key> { type: 'text', value: _ })).concat({ type: 'backspace', value: undefined }),
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(_ => (<Key> { type: 'text', value: _ })).concat({ type: 'blank', value: '_' }),
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(_ => (<Key> { type: 'text', value: _ })).concat({ type: 'empty', value: undefined }, { type: 'empty', value: undefined })
  ]
};

const numericKeyboard: Keyboard = {
  name: 'numeric',
  layout: [
    ['1', '2', '3', '4', '5'].map(_ => (<Key> { type: 'number', value: _ })),
    ['6', '7', '8', '9', '0'].map(_ => (<Key> { type: 'number', value: _ })),
    [{ type: 'empty', value: undefined }, { type: 'empty', value: undefined }, { type: 'backspace', value: undefined }, { type: 'clear', value: 'clear' }]
  ]
};

@Component({
  selector: 'acr-keyboard',
  templateUrl: './keyboard.component.html',
  encapsulation: ViewEncapsulation.None
})
export class KeyboardComponent {
  @Input() public text = '';
  @Input() public keyboardLayout: string;
  @Output() public inputChanged: EventEmitter<string> = new EventEmitter();
  protected keyboards = [textKeyboard, numericKeyboard];

  public get keyboard(): Keyboard {
    const k = this.keyboards.find(kb => kb.name === this.keyboardLayout);
    return k ? k : textKeyboard;
  }

  public keyPress(key: Key): void {
    switch (key.type) {
      case 'number':
      case 'text':
        this.text += key.value;
        break;
      case 'backspace':
        if (this.text.length > 0) {
          this.text = this.text.slice(0, -1);
        }
        break;
      case 'blank':
        this.text += '_';
        break;
      case 'clear':
        this.text = '';
        break;
    }
    this.inputChanged.emit(this.text);
  }

  public isKeyDisabled(keyType: string): boolean {
    return ((this.text.length < 1 && (keyType === 'backspace' || keyType === 'clear')) ||
           (this.text.length >= 4 && keyType === 'number')) &&
           this.keyboard.name === 'numeric';
  }
}
