import { logManager } from 'dotsdk';

export const appLogManager = logManager.configure({
  minLevels: {
    '': 'error',
    taka: 'debug',
  },
});

export const appLogger = appLogManager.getLogger('taka.app');
export const paymentLogger = appLogManager.getLogger('taka.payment');
