import { AfterViewInit, Component, EventEmitter, Input, Output, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'acr-vertical-scroll-buttons',
  templateUrl: './vertical-scroll-buttons.component.html'
})
export class VerticalScrollButtonsComponent implements AfterViewInit {

  @Input() public scrollRef: any;
  @Input() public incrementHeight: number;
  @Output() public scrollArrowClick: EventEmitter<any> = new EventEmitter();
  public disableUpArrow = true;
  public disableDownArrow = false;

  constructor(private renderer: Renderer2,
              private activatedRoute: ActivatedRoute) {}

  public ngAfterViewInit() {
    this.renderer.listen(this.scrollRef, 'scroll', () => {
      this.evaluateDisable();
    });
    this.renderer.listen(this.scrollRef, 'click', () => {
      this.evaluateDisable();
    });
    this.activatedRoute.paramMap.subscribe(params => {
      setTimeout(() => {
        this.evaluateDisable();
      }, 0);
    });
  }

  public onScrollUp() {
    const scrollOptions = {
      top: 0,
      left: 0,
      behavior: 'smooth'
    };
    const increment = Math.ceil((this.incrementHeight || this.scrollRef.clientHeight / 5) * 100 / 100);
    if (this.scrollRef.scrollTop > increment) {
      scrollOptions.top = this.scrollRef.scrollTop - increment;
    } else {
      scrollOptions.top = 0;
    }
    this.scrollArrowClick.emit();
    this.scrollRef.scrollTo(scrollOptions);
    setTimeout(() => {
      this.evaluateDisable();
    }, 0);
  }
  public onScrollDown() {
    const scrollOptions = {
      top: 0,
      left: 0,
      behavior: 'smooth'
    };
    const increment = Math.ceil(this.incrementHeight || this.scrollRef.clientHeight / 5);
    if (this.scrollRef.scrollHeight - (this.scrollRef.scrollTop + this.scrollRef.clientHeight) > increment) {
      scrollOptions.top = this.scrollRef.scrollTop + increment;
    } else {
      scrollOptions.top = this.scrollRef.scrollHeight - this.scrollRef.clientHeight;
    }
    this.scrollArrowClick.emit();
    this.scrollRef.scrollTo(scrollOptions);
    setTimeout(() => {
      this.evaluateDisable();
    }, 0);
  }
  public evaluateDisable() {
    if (this.scrollRef?.clientHeight === this.scrollRef?.scrollHeight) {
      this.disableDownArrow = true;
      this.disableUpArrow = true;
      return;
    }
    this.disableDownArrow = Math.ceil(this.scrollRef?.scrollTop) + this.scrollRef?.clientHeight >= this.scrollRef?.scrollHeight;
    this.disableUpArrow = this.scrollRef?.scrollTop === 0;
  }
}
