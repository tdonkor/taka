declare global {
  interface Window {
    automation: boolean;
    production: boolean;
  }
}

import * as _ from 'lodash';

/**
 * Log function that takes into consideration if the environment is set on automation or not.
 * Works exactly like console.log function.
 * @param msg : Message for the log. Same as first parameter of console.log function
 * @param obj : Object to be logged. Same as second parameter of console.log function
 */
export function log(msg: string, obj: any = '') {
  if (window.production) {
    return;
  }

  if (window.automation) {
    console.log('[AUTOMATION] ' + msg, JSON.stringify(obj));
  } else {
    if (!_.isEmpty(obj)) {
      const styles = 'color: #000080; font-weight: bold; font-size:14px';

      console.log(`%c ${msg.toUpperCase()} `, styles, obj);
    }
  }
}
