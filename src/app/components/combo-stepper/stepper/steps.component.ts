import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { DotCombo, DotPage } from 'dotsdk';

const stepPosition = {
  start: 0,
  middle: 1,
  end: 2,
};

@Component({
  selector: 'acr-steps',
  templateUrl: './steps.component.html',
})
export class StepsComponent implements OnInit, OnChanges {
  @Input() public steps: DotCombo[] | DotPage[] = [];
  @Input() public activeIndex = 0;

  public localSteps: DotCombo[] | DotPage[];
  public currentHighlight: number;
  public activeClass = 'active';
  public isCombo: boolean;

  constructor() {}

  public ngOnInit() {
    this.isCombo = this.steps?.length && this.steps[0] instanceof DotCombo;
  }

  public ngOnChanges(changes: SimpleChanges) {
    // * initial position */
    if (changes.activeIndex && changes.activeIndex.currentValue <= 1) {
      this.localSteps = this.steps.slice(0, this.activeIndex + 3);
      this.currentHighlight = changes.activeIndex.currentValue;
    }

    if (changes.activeIndex && changes.activeIndex.currentValue > 1) {
      // * last postision */
      if (changes.activeIndex.currentValue === this.steps.length - 1) {
        this.currentHighlight = stepPosition.end;
        return;
      }
      // * rest positions */
      this.localSteps = this.steps.slice(
        changes.activeIndex.currentValue - 1,
        changes.activeIndex.currentValue + 2
      );
      this.currentHighlight = stepPosition.middle;
      // * caching class breaks transition * /
      this.activeClass = '';
      setTimeout(() => {
        this.activeClass = 'active';
      }, 200);
    }
  }

  public getStep(index: number) {
    return this.localSteps[index];
  }

  public stepsLength() {
    return this.steps.length < 3 ? this.steps.length : 3;
  }

  public cssClasses(index: number) {
    return {
      [this.activeClass]: this.currentHighlight === index,
      selected: index < this.currentHighlight,
    };
  }
}
