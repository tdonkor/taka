import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { CoreModule } from './core.module';
import { DotCdkTranslateCaptionPipe } from './pipes/dot-translate-caption.pipe';
import { DotCdkTranslatePipe } from './pipes/dot-translate.pipe';
import { DotCdkTitleTranslatePipe } from './pipes/dot-title-translate.pipe';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { StatusService } from './services/status.service';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule.forRoot(environment)
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    DotCdkTranslateCaptionPipe,
    DotCdkTranslatePipe,
    DotCdkTitleTranslatePipe,
    {provide: Window, useValue: window},
    {
      provide: APP_INITIALIZER,
      useFactory: (statusService: StatusService) => {
        return () => statusService.startSdkPeripheralCheck()
      },
      deps: [StatusService],
      multi: true
     }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
