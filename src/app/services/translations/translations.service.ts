import { Inject, Injectable } from '@angular/core';
import { DotI18n, DotI18nLoader, DotButton } from 'dotsdk';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { Language } from './language.interface';
// import { DotRuntimeConfigurationService } from '../runtime-configuration/runtime-configuration.service';
import { ApplicationSettingsService } from '../app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationsService {

  public translations: { [key: number]: { default: string; languages: { [code: string]: string } } } = {};

  protected _languages: Language[] = [];
  protected _dictionary: DotI18n[];
  protected _currentLanguage: Language;

  private _languageChanged: Subject<Language> = new Subject();
  private languageSnapshot$ = new BehaviorSubject<Language>(null);


  public get onLanguageChanged() {
    return this._languageChanged.asObservable();
  }

  public get currentLanguage() {
    return this._currentLanguage;
  }

  constructor(
    private appSettings: ApplicationSettingsService,
    // private runtimeConfiguration: DotRuntimeConfigurationService,
    @Inject(DOCUMENT) private _document: any
  ) {}

  public initialize(languages: Language[]) {
    this._languages = languages;
    const defaultLanguage = this._languages.find((x) => x.code === this.appSettings.defaultLanguage);
    this._currentLanguage = defaultLanguage || this._languages.first();
    // this.runtimeConfiguration.currentLanguage = this._currentLanguage;

    this._dictionary = DotI18nLoader.getInstance().loadedModel;
    this._dictionary.forEach((value: DotI18n) => {
      let id = 0;
      let def = '';
      const lang = {};
      Object.keys(value).forEach((key) => {
        if (key.toLowerCase() === 'id') {
          id = Number(value[key]);
          return;
        }
        if (key.toLowerCase() === 'def') {
          def = value[key];
          return;
        }
        lang[key.toLowerCase()] = value[key];
        return;
      });
      this.translations[id] = {
        default: def,
        languages: lang,
      };
    });
  }
  /**
   * Will set current language based on language code.
   *
   * If languageCode doesn't exist in _languages array, will go for first language
   *
   * @param languageCode The current selected language code
   */
  public setCurrentLanguage(languageCode: string) {
    this.checkRTL(languageCode);
    this._currentLanguage = this._languages.some((x) => x.code.toLowerCase() === languageCode.toLowerCase())
      ? this._languages.find((x) => x.code.toLowerCase() === languageCode.toLowerCase())
      : this._languages.first();
    this._languageChanged.next(this._currentLanguage);
    // this.runtimeConfiguration.currentLanguage = this._currentLanguage;
  }

  public checkRTL(languageCode: string) {
    if (this._languages.find((x) => x.code.toLowerCase() === languageCode.toLowerCase()).rtl) {
      this._document.body.classList.add('rtl');
    } else {
      if (this._document.body.classList.contains('rtl')) {
        this._document.body.classList.remove('rtl');
      }
    }
  }

  public translate(id: string) {
    if (!id) {
      return null;
    }

    const translationKey = this.translations[id];
    if (!translationKey) {
      return id;
    }

    const translation = translationKey.languages[this._currentLanguage.code.toLowerCase()];
    if (translation) {
      return translation;
    }
    if (translationKey.default) {
      return translationKey.default;
    }
    return id;
  }

  public translateTitle(title: DotI18n | string): string {
    if (!title) {
      return '';
    }

    if (typeof title !== 'string') {
      return title[this._currentLanguage.code.toUpperCase()] ? title[this._currentLanguage.code.toUpperCase()] : title['DEF'];
    } else {
      return title;
    }
  }

  public getTranslatedButtonCaption(item: DotButton): string {
    if (item && item.CaptionDictionary && this._currentLanguage && this._currentLanguage.code) {
      const t = item.CaptionDictionary[this._currentLanguage.code.toUpperCase()];
      return t ? t : item.CaptionDictionary['DEF'];
    } else if (item && item.Caption) {
      return item.Caption;
    } else {
      return null;
    }
  }

  // added by TD
  public getTranslatedButtonDescription(item: DotButton): string {
      if (item && item.DescriptionDictionary && this._currentLanguage && this._currentLanguage.code) {
        const t = item.DescriptionDictionary[this._currentLanguage.code.toUpperCase()];
        return t ? t : item.DescriptionDictionary['DEF'];
      } else if (item && item.Description) {
        return item.Description;
      } else {
        return null;
      }
    }

  public getTranslatedButtonPicture(item: DotButton): string {
    if (
      item &&
      item.PictureDictionary &&
      Object.keys(item.PictureDictionary).length !== 0 &&
      this._currentLanguage &&
      this._currentLanguage.code
    ) {
      const t = item.PictureDictionary[this._currentLanguage.code.toUpperCase()];
      return t ? t : item.PictureDictionary['DEF'];
    } else if (item && item.Picture) {
      return item.Picture;
    } else {
      return null;
    }
  }

  public saveSnapshot() {
    this.languageSnapshot$.next(this.currentLanguage);
  }

  public recoverFromSnapShot() {
    if (this.languageSnapshot$.value !== null) {
      this.setCurrentLanguage(this.languageSnapshot$.value.code);
    }
  }
}
