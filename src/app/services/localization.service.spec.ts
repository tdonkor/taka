import { AtpApplicationSettings } from 'dotsdk';
import { ApplicationSettingsService } from './app-settings.service';
import { LocalizationService } from './localization.service';

let instance: LocalizationService;
let appSettings: ApplicationSettingsService;
let atpApplicationSettings: AtpApplicationSettings;

const valueWithDecimals = 123.123;
const decimals = 4;
const negativeDecimals = -3;
const valueWithoutDecimals = 123;
let formatNumber: any;
let formatDate: any;
let formatCurrency: any;


fdescribe ('Localization Service test', () => {
  beforeEach(() => {
    atpApplicationSettings = AtpApplicationSettings.getInstance();
    atpApplicationSettings.setBundleSettingsJson({
      printerMaxCharsPerRow: 5,
      kioskId: 1,
      sharedFolderPath: 'blah',
      POSCheckMode: 'asd',
      paymentCheckMode: 'asd',
      scannerCheckMode: 'vvv',
      printerCheckMode: 'xxx',
    });
    appSettings = new ApplicationSettingsService(atpApplicationSettings);
    instance = new LocalizationService(appSettings);
  });

  it('should create an instance of AtpApplication Service', () => {
    expect(atpApplicationSettings).toBeDefined();
  });
  it('should create an instance of appSettings Service', () => {
    expect(appSettings).toBeDefined();
  });
  it('should create an instance of Localization Service', () => {
   expect(instance).toBeDefined();
  });
  it ('should format number without decimals', () => {
    formatNumber = instance.formatNumber(valueWithoutDecimals);
    expect(formatNumber).toBe('123');
  });
  it ('should format number with decimals', () => {
    formatNumber = instance.formatNumber(valueWithDecimals, decimals);
    expect(formatNumber).toBe('123.1230');
  });
  it ('should format number with decimals when decimals missing', () => {
    formatNumber = instance.formatNumber(valueWithDecimals);
    expect(formatNumber).toBe('123');
  });
  it ('should format number without decimals when decimals is negative', () => {
    formatNumber = instance.formatNumber(valueWithDecimals, negativeDecimals);
    expect(formatNumber).toBe('123');
  });
  it ('should format number with decimals when separator is _', () => {
    appSettings.decimalSeparator = '_';
    formatNumber = instance.formatNumber(valueWithDecimals, decimals);
    expect(formatNumber).toBe('123_1230');
  });
  it ('should format number without decimals when separator is _', () => {
    appSettings.decimalSeparator = '_';
    formatNumber = instance.formatNumber(valueWithDecimals);
    expect(formatNumber).toBe('123');
  });
  it ('should format number with 2 decimals when separator is _', () => {
    appSettings.decimalSeparator = '_';
    formatNumber = instance.formatNumber(valueWithDecimals, 2);
    expect(formatNumber).toBe('123_12');
  });

  it ('should format date without pattern', () => {
    formatDate = instance.formatDate(new Date(2019, 0, 28, 23, 59, 12));
    expect(formatDate).toBe('2019-01-28 23:59:12');
  });
  it ('should format date with pattern HH:mm:ss', () => {
    formatDate = instance.formatDate(new Date(2020, 4, 9, 23, 59, 12), 'HH:mm:ss');
    expect(formatDate).toBe('23:59:12');
  });

  it ('should format currency with $', () => {
    appSettings.currencySymbolBefore = true;
    formatCurrency = instance.formatCurrency(valueWithDecimals);
    expect(formatCurrency).toBe('$1.23');
  });

  it ('should format currency with 元 before price', () => {
    appSettings.currencySymbolBefore = true;
    appSettings.currencySymbol = '元';
    formatCurrency = instance.formatCurrency(valueWithDecimals);
    expect(formatCurrency).toBe('元1.2');
  });

  it ('should format currency with 元 after price', () => {
    appSettings.currencySymbolBefore = false;
    appSettings.currencySymbol = '元';
    formatCurrency = instance.formatCurrency(valueWithDecimals);
    expect(formatCurrency).toBe('1.2元');
  });

  it ('should format currency with KR after price', () => {
    appSettings.currencySymbolBefore = false;
    appSettings.currencySymbol = 'KR';
    formatCurrency = instance.formatCurrency(valueWithDecimals);
    expect(formatCurrency).toBe('1KR');
  });
});







