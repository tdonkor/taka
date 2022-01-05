import { AtpApplicationSettings, DotButton, PosConfig, PosElogHandler, PosHeaderConfig, PosOrderConfig } from 'dotsdk';

import { AllergensService } from './allergens.service';
import { ApplicationSettingsService } from './app-settings.service';
import { BasketService } from './basket.service';
import { CheckoutService } from './checkout.service';
import { DotCdkTranslatePipe } from '../pipes/dot-translate.pipe';
import { DynamicContentService } from './dynamic-content/dynamic-content.service';
import { PAYMENT_TYPE } from '../models';
import { PosOperationsService } from './pos-operations.service';
import { PromosService } from './promos.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SessionService } from './session.service';
import { StatusService } from './status.service';
import { TestBed } from '@angular/core/testing';
import { TranslationsService } from './translations/translations.service';

let instance: CheckoutService;
let appSettings: ApplicationSettingsService;
let atpApplicationSettings: AtpApplicationSettings;
let router: Router;
let sessionService: SessionService;
// tslint:disable-next-line:prefer-const
let document: any;
// tslint:disable-next-line:prefer-const
let allergensService: AllergensService;
let basketService: BasketService;
// tslint:disable-next-line:prefer-const
let promosService: PromosService;
let statusService: StatusService;
// tslint:disable-next-line:prefer-const
let dynamicContentService: DynamicContentService;
// tslint:disable-next-line:prefer-const
let translatePipe: DotCdkTranslatePipe;

fdescribe('Checkout Service test', () => {
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
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
    }).compileComponents();
    router = TestBed.inject(Router);
    appSettings = new ApplicationSettingsService(atpApplicationSettings);
    appSettings.maxPaymentRetries = 6;
    basketService = new BasketService(appSettings, dynamicContentService, router, promosService, document);
    sessionService = new SessionService(
      new TranslationsService(appSettings, document),
      appSettings,
      allergensService,
      basketService,
      promosService,
      document
    );
    statusService = new StatusService(appSettings, translatePipe);
    statusService.paymentsAvailableForApp.push({
      PaymentType: PAYMENT_TYPE.CARD,
      PaymentName: 'paymentNameTest',
      Image: 'noImage',
      PaymentRetries: 2,
      PaymentIsEnabled: true,
    });
    instance = new CheckoutService(
      router,
      appSettings,
      sessionService,
      basketService,
      statusService,
      dynamicContentService,
      new PosOperationsService(appSettings)
    );
    PosElogHandler.getInstance().posConfig = new PosConfig({
      posHeader: new PosHeaderConfig({}),
      posOrder: new PosOrderConfig([]),
    });
  });
  it('should create an instance of AtpApplication Service', () => {
    expect(atpApplicationSettings).toBeDefined();
  });
  it('should create an instance of appSettings Service', () => {
    expect(appSettings).toBeDefined();
  });
  it('should create an instance of checkout Service', () => {
    expect(instance).toBeDefined();
  });
  it('should update add 2 buttons in basket', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1 }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2 }));
    expect(basketService.buttons.length).toEqual(2);
  });
  it('should update elog subtotalCents before end scene', () => {
    instance.subtotalCents = 100;
    const navigateSpy = spyOn(router, 'navigate');
    instance.startEndSceneNavigation();
    expect(PosElogHandler.getInstance().posConfig.posHeader.amounts.subtotalAmount).toEqual(instance.subtotalCents);
  });
  it('should update elog tax before end scene', () => {
    instance.taxCents = 100;
    const navigateSpy = spyOn(router, 'navigate');
    instance.startEndSceneNavigation();
    expect(PosElogHandler.getInstance().posConfig.posHeader.amounts.taxAmount).toEqual(instance.taxCents);
  });

  it('should navigate to cod-view', () => {
    const navigateSpy = spyOn(router, 'navigate');
    appSettings.skipPrecalculate = true;
    instance.startEndSceneNavigation();
    expect(navigateSpy).toHaveBeenCalledWith(['cod-view']);
  });
  it('should navigate to calculate-totals', () => {
    const navigateSpy = spyOn(router, 'navigate');
    appSettings.skipPrecalculate = false;
    instance.startEndSceneNavigation();
    expect(navigateSpy).toHaveBeenCalledWith(['calculate-totals']);
  });

  it('should return order discount on button', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1, $$OrderDiscount: 500 }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2 }));
    const orderDiscount = instance['orderDiscount']() as number;
    expect(orderDiscount).toEqual(500);
  });
  it('should return 0 discount, no button has discounts', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1 }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2 }));
    const orderDiscount = instance['orderDiscount']() as number;
    expect(orderDiscount).toEqual(0);
  });
  it('should reset order totals', () => {
    instance.resetOrderTotal();
    expect(instance['_subtotalCents']).toEqual(0);
    expect(instance['_taxCents']).toEqual(0);
  });

  it('should check basket modification, check length', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1 }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2 }));
    instance['_basketButtons'] = [];
    instance['_basketButtons'].push(new DotButton({ Link: '1', ButtonType: 1 }));
    const sameBasket = instance['sameBasket']();
    expect(sameBasket).toBeFalse();
  });

  it('should check basket modification, check UUID, quantity', () => {
    basketService.buttons.push(
      new DotButton({
        Link: '1',
        ButtonType: 1,
        uuid: 'a4eda6d6-fb7a-11eb-9a03-0242ac130003',
        quantity: 2,
      })
    );
    basketService.buttons.push(
      new DotButton({
        Link: '2',
        ButtonType: 2,
        uuid: '58581eba-38f0-4db4-8819-b280f9cc6987',
        quantity: 4,
      })
    );
    instance['_basketButtons'] = [];
    instance['_basketButtons'].push(
      new DotButton({
        Link: '1',
        ButtonType: 1,
        uuid: 'a4eda6d6-fb7a-11eb-9a03-0242ac130003',
        quantity: 2,
      })
    );
    instance['_basketButtons'].push(
      new DotButton({
        Link: '2',
        ButtonType: 2,
        uuid: '58581eba-38f0-4db4-8819-b280f9cc6987',
        quantity: 4,
      })
    );
    const sameBasket = instance['sameBasket']();
    expect(sameBasket).toBeTrue();
  });

  it('should check basket modification, check UUID, quantity, modifiers', () => {
    basketService.buttons.push(
      new DotButton({
        Link: '1',
        ButtonType: 1,
        uuid: 'a4eda6d6-fb7a-11eb-9a03-0242ac130003',
        quantity: 2,
      })
    );
    basketService.buttons.push(
      new DotButton({
        Link: '2',
        ButtonType: 2,
        uuid: '58581eba-38f0-4db4-8819-b280f9cc6987',
        quantity: 4,
        ModifiersPage: {
          Modifiers: [
            {
              PageInfo: [],
              Buttons: [
                {
                  Selected: false,
                  Enabled: true,
                  Visible: false,
                },
              ],
            },
          ],
        },
      })
    );
    instance['_basketButtons'] = [];
    instance['_basketButtons'].push(
      new DotButton({
        Link: '1',
        ButtonType: 1,
        uuid: 'a4eda6d6-fb7a-11eb-9a03-0242ac130003',
        quantity: 2,
      })
    );
    instance['_basketButtons'].push(
      new DotButton({
        Link: '2',
        ButtonType: 2,
        uuid: '58581eba-38f0-4db4-8819-b280f9cc6987',
        quantity: 4,
        ModifiersPage: {
          Modifiers: [
            {
              PageInfo: [],
              Buttons: [
                {
                  Selected: false,
                  Enabled: true,
                  Visible: true,
                },
              ],
            },
          ],
        },
      })
    );
    const sameBasket = instance['sameBasket']();
    expect(sameBasket).toBeFalse();
  });

  it('should return subtotalsCents equal with basketService totalPrice', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1, Price: '100' }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2, Price: '200' }));
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_subtotalCents']).toEqual(basketService.totalPrice);
  });
  it('should return taxCents equal with 0', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_taxCents']).toEqual(0);
  });
  it('should return orderPosNumber null', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_orderPOSNumber']).toBeNull();
  });
  it('should return tenderMediaId equal with -1', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_tenderMediaId']).toEqual('-1');
  });
  it('should return payment retries', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_paymentRetries']).toEqual(appSettings.maxPaymentRetries);
  });
  it('should return opened order to be false', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_openedOrder']).toBeFalse();
  });
  it('should return receipt pay at counter to be empty string', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_receiptPayAtCounter']).toEqual('');
  });
  it('should return receipt content to be empty string', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance['_receiptContent']).toEqual('');
  });
  it('should return payment type', () => {
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    const paymentEnabled = statusService.paymentsAvailableForApp.find((payment) => payment.PaymentIsEnabled === true);
    expect(instance.paymentType.toString()).toEqual(paymentEnabled.PaymentType.toString());
  });
  it('should call startEndSceneNavigation method', () => {
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(instance, 'startEndSceneNavigation');
    instance['_basketButtons'] = null;
    instance.startCheckoutTunnel();
    expect(instance.startEndSceneNavigation).toHaveBeenCalled();
  });
  it('should call startEndSceneNavigation method', () => {
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(instance, 'startEndSceneNavigation');
    instance['_basketButtons'] = null;
    instance.startCheckoutTunnel();
    expect(instance.startEndSceneNavigation).toHaveBeenCalled();
  });

  it('should check navigate to cod-view', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1 }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2 }));
    instance['_basketButtons'] = [];
    instance['_basketButtons'].push(new DotButton({ Link: '1', ButtonType: 1 }));
    instance['_basketButtons'].push(new DotButton({ Link: '2', ButtonType: 2 }));
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(navigateSpy).toHaveBeenCalledWith(['cod-view']);
  });

  it('should call startEndSceneNavigation method (basket modified)', () => {
    basketService.buttons.push(new DotButton({ Link: '1', ButtonType: 1 }));
    basketService.buttons.push(new DotButton({ Link: '2', ButtonType: 2 }));
    instance['_basketButtons'] = [];
    instance['_basketButtons'].push(new DotButton({ Link: '1', ButtonType: 1 }));
    spyOn(instance, 'startEndSceneNavigation');
    const navigateSpy = spyOn(router, 'navigate');
    instance.startCheckoutTunnel();
    expect(instance.startEndSceneNavigation).toHaveBeenCalled();
  });
});
