import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Animations } from '@dotxix/animation';
import { AbstractDynamicComponent, ApplicationSettingsService, DynamicContentRef } from '@dotxix/services';
import { AtpFilesService } from 'dotsdk';

@Component({
  selector: 'acr-calories',
  templateUrl: './calories.component.html',
  animations: [Animations.popupIn, Animations.popupOut],
  encapsulation: ViewEncapsulation.None,
})
export class CaloriesComponent extends AbstractDynamicComponent implements OnInit {
  public images: string[];
  public currentIndex = 0;
  public exitAnimation = false;

  public get currentImage(): string {
    return this.images && this.images.length > 0 ? this.images[this.currentIndex] : '';
  }

  constructor(protected dynamicContentRef: DynamicContentRef, protected applicationSettingsService: ApplicationSettingsService) {
    super();
  }
  public async ngOnInit(): Promise<void> {
    const allergenFileList = await AtpFilesService.getInstance().getDirectoryContent(
      'shared\\assets\\skins\\fullHD\\DAHComponent\\allergens'
    );
    this.images = allergenFileList
      ? allergenFileList.Files.map(
          (f) => `${this.applicationSettingsService.bridgeAssetsPath}\\skins\\fullHD\\DAHComponent\\allergens\\${f}`
        )
      : [];
  }
  public closeClick(): void {
    this.exitAnimation = true;
    setTimeout(() => this.dynamicContentRef.close(), 350);
  }
  public previousImage(): void {
    this.currentIndex--;
  }
  public nextImage(): void {
    this.currentIndex++;
  }
}
