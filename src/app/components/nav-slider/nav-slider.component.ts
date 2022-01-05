import { ActivatedRoute, Router } from '@angular/router';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { DotAvailabilityService, DotButton, DotPage, getMainPage, getPage } from 'dotsdk';

import { HomeButtonDisplayType } from '@dotxix/models';
import { Subscription } from 'rxjs';
import { ApplicationSettingsService, ContentService, DynamicContentService } from '@dotxix/services';
import { onAdaUpdate } from '@dotxix/helpers';

@Component({
  selector: 'acr-nav-slider',
  templateUrl: './nav-slider.component.html',
})
export class NavSliderComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() public navButtonClick: EventEmitter<void> = new EventEmitter();
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  @ViewChild('arrowRight') public arrowRightEl: ElementRef;
  @ViewChild('arrowLeft') public arrowLeftEl: ElementRef;
  public navButtons: DotButton[];
  public page: DotPage;
  public selectedNavButtonLink: string;
  public mainPage: DotPage;
  public buttonSize: number;
  public currentIndex: number;
  public disableRightArrow = false;
  public disableLeftArrow = true;
  public subscriptions: Subscription[] = [];

  // INFINITE SCROLL - SETTINGS
  public infiniteNavButtons: DotButton[] = [];
  public firstRunInfinite = true;
  public navClickedIndex = -1;

  public get modifiedNavigationButtons(): DotButton[] {
    return this.appSettings.infiniteNavbarScroll ? this.infiniteNavButtons : this.navButtons;
  }

  public get isHomeButtonDocked(): boolean {
    return this.appSettings.homeButtonDisplay === HomeButtonDisplayType.DISPLAY_DOCKED;
  }
  public get isHomeButtonScrollable(): boolean {
    return this.appSettings.homeButtonDisplay === HomeButtonDisplayType.DISPLAY_SCROLL;
  }

  public get hasNavArrows(): boolean {
    return this.appSettings.touchlessMode;
  }

  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected contentService: ContentService,
    protected dynamicContentService: DynamicContentService,
    protected appSettings: ApplicationSettingsService,
    protected cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        const pageId = params.get('pageId');
        this.mainPage = getMainPage();
        this.page = pageId === this.mainPage.ID ? getMainPage() : getPage(pageId, true);
        this.navButtons = this.page.NavigationButtons.filter((btn) => DotAvailabilityService.getInstance().isNavbarButtonAvailable(btn));

        this.currentIndex = this.navButtons.findIndex((btn) => btn.Link === pageId);

        this.selectedNavButtonLink = this.navButtons.find((btn) =>
          this.checkPageContainsLinkInDepth(getPage(btn.Link, true))
        )?.Link;

        if (
          this.appSettings.homeButtonDisplay !== HomeButtonDisplayType.DO_NOT_DISPLAY &&
          !this.selectedNavButtonLink &&
          this.page.ID === this.mainPage.ID
        ) {
          this.selectedNavButtonLink = this.mainPage.ID;
        }

        setTimeout(() => {
          this.initScrollBehavior();
          this.evaluateDisable();
        });
      })
    );
  }

  public ngAfterViewInit() {
    this.subscriptions.push(
      onAdaUpdate.subscribe((bol) => {
        this.initScrollBehavior();
      })
    );
  }

  public scrollRight() {
    const scrollOptions = {
      left: 0,
      top: 0,
      behavior: 'smooth',
    };

    const scrollRef = this.scrollRef.nativeElement;

    if (scrollRef.scrollWidth - (scrollRef.scrollLeft + scrollRef.clientWidth) > this.buttonSize) {
      scrollOptions.left = scrollRef.scrollLeft + this.buttonSize;
    } else {
      scrollOptions.left = scrollRef.scrollWidth - scrollRef.clientWidth;
    }

    scrollRef.scrollTo(scrollOptions);
    this.cdRef.detectChanges();
  }

  public scrollLeft() {
    const scrollOptions = {
      left: 0,
      top: 0,
      behavior: 'smooth',
    };
    if (this.scrollRef.nativeElement.scrollLeft > this.buttonSize) {
      scrollOptions.left = this.scrollRef.nativeElement.scrollLeft - this.buttonSize;
    } else {
      scrollOptions.left = 0;
    }
    this.scrollRef.nativeElement.scrollTo(scrollOptions);
    this.cdRef.detectChanges();
  }

  public navigate(button: DotButton, index: number) {
    this.navClickedIndex = index;
    this.dynamicContentService.closeAllDialogs();

    const page = getPage(button.Link, true);

    if (page) {
      this.router.navigate(['menu', page.ID]);
      this.navButtonClick.emit();
    }
  }

  public goToHomePage() {
    this.router.navigate(['menu', this.mainPage.ID]);
    this.dynamicContentService.closeAllDialogs();
    this.navButtonClick.emit();
  }

  public checkPageContainsLinkInDepth(page: DotPage): boolean {
    if (page.ID === this.page.ID) {
      return true;
    }

    for (const button of page.Buttons) {
      if (button.Page) {
        const check = this.checkPageContainsLinkInDepth(button.Page);
        if (check) {
          return check;
        }
      }
    }
    return false;
  }

  public evaluateDisable() {
    this.updateInfiniteScroll();

    this.disableRightArrow =
      this.scrollRef?.nativeElement.scrollLeft + this.scrollRef?.nativeElement.clientWidth === this.scrollRef?.nativeElement.scrollWidth;
    this.disableLeftArrow = this.scrollRef?.nativeElement.scrollLeft === 0;
  }

  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
    this.infiniteNavButtons = [];
  }

  private initScrollBehavior() {
    if (this.navClickedIndex === -1) {
      this.firstRunInfinite = true;
    }

    // Reset infinite scroll
    if (this.firstRunInfinite && this.appSettings.infiniteNavbarScroll) {
      this.firstRunInfinite = false;
      this.infiniteNavButtons = [...this.navButtons];
    }

    if (this.navClickedIndex >= 0) {
      this.currentIndex = this.navClickedIndex;
      this.navClickedIndex = -1;
    }

    setTimeout(() => {
      this.buttonSize = this.scrollRef.nativeElement.scrollWidth / this.modifiedNavigationButtons.length;

      const scrollOptions = {
        left: 0,
        top: 0,
        behavior: 'smooth',
      };

      // Scroll to item on click (first item to the left on nav-slider)
      if (this.currentIndex >= 0) {
        scrollOptions.left += this.buttonSize * this.currentIndex;
      }

      this.scrollRef.nativeElement.scrollTo(scrollOptions);
    });
  }

  private updateInfiniteScroll(): void {
    if (!this.appSettings.infiniteNavbarScroll) {
      return;
    }

    // Infinite scroll should be enabled if no. of buttons exceeds clientWidth
    if (this.scrollRef.nativeElement.clientWidth > this.buttonSize * this.navButtons.length) {
      return;
    }

    const totalWidthOfScroll = this.scrollRef.nativeElement.scrollWidth;
    const leftScrollOffset = this.scrollRef.nativeElement.scrollLeft;
    const rightScrollOffset = totalWidthOfScroll - leftScrollOffset;

    const buttonWidth =
      this.scrollRef.nativeElement.children && this.scrollRef.nativeElement.children.length
        ? this.scrollRef.nativeElement.children[0].clientWidth
        : this.buttonSize || 0;
    const limitReach = buttonWidth * Math.ceil(this.navButtons.length / 2);
    if (limitReach > rightScrollOffset) {
      this.infiniteNavButtons = [...this.infiniteNavButtons, ...this.navButtons];
    }
  }
}
