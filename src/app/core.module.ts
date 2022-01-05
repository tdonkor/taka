import { AtpApplicationSettings } from 'dotsdk';
import { ComponentsModules } from './components/components.module';
import { ModuleWithProviders } from '@angular/core';
import { NgModule } from '@angular/core';
import { PagesModule } from './pages/pages.module';
import { SuggestionSalesComponent } from './components/suggestion-sales/suggestion-sales.component';

@NgModule({
  declarations: [],
  imports: [PagesModule, ComponentsModules],
  exports: [PagesModule, ComponentsModules],
  providers: [
    {
      provide: 'APP_SETTINGS',
      useFactory: () => AtpApplicationSettings.getInstance(),
    },
    {
      provide: 'SUGGESTION_COMPONENT',
      useValue: SuggestionSalesComponent,
    },
  ],
})
export class CoreModule {
  public static forRoot(env: any): ModuleWithProviders {
    window.automation = env.automation;
    window.production = env.production;
    return {
      ngModule: CoreModule,
      providers: [
        {
          provide: 'ENVIRONMENT',
          useValue: env,
        },
      ],
    };
  }
}
