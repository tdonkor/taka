import { AtpApplicationSettings, IFoundFriendApp, AtpTweetService, AtpEnvironmentService } from 'dotsdk';
import { Subject } from 'rxjs';
import { log } from './log.helper';

export const onAdaUpdate: Subject<boolean> = new Subject();

export function isAdaEnabled(): boolean {
  return document.documentElement.classList.contains('ada');
}

export function enabledTouchlessMode(): boolean {
  return !!AtpApplicationSettings.getInstance().bundleSettingsJson.touchlessMode;
}

export async function toggleAdaMode(): Promise<void> {
  const adaClass = AtpApplicationSettings.getInstance().bundleSettingsJson.enabledTouchlessDM ? 'ada--touchless' : 'ada';
  if (document.documentElement.classList.contains(adaClass)) {
    disableAdaMode(adaClass);
    onAdaUpdate.next(false);
  } else {
    enableAdaMode(adaClass);
    onAdaUpdate.next(true);
  }
}

export async function disableAdaMode(adaClass: string) {
  document.documentElement.classList.remove(adaClass);
  if (adaClass === 'ada--touchless') {
    await sendTweetToFacePeripheral({ OperationType: 7 });
  }
}
export async function enableAdaMode(adaClass: string) {
  document.documentElement.classList.add(adaClass);
  if (adaClass === 'ada--touchless') {
    await sendTweetToFacePeripheral({ OperationType: 6 });
  }
}

export function getTouchlessClass({classFullHD, classAda, classFullHDTouchless, classAdaTouchless}) {
  if (enabledTouchlessMode()) {
    return isAdaEnabled() ? classAdaTouchless : classFullHDTouchless;
  } else {
    return isAdaEnabled() ? classAda : classFullHD;
  }
}

let outgoingServiceApp: IFoundFriendApp;

async function sendTweetToFacePeripheral(message: { OperationType: number }): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // get the destination service app
    outgoingServiceApp = outgoingServiceApp || (await findOutgoingServiceApp());
    if (!outgoingServiceApp) {
      reject('Facial recognition outgoing service app not found');
      return;
    }
    // send message to destination
    log('@@@  Started sending ADA to facial recognition service app...  @@@', {outgoingServiceApp, message});
    AtpTweetService.getInstance().tweetMessage(outgoingServiceApp, JSON.stringify(message), false).then(
      (d) => {
        log('@@@  Sent ADA to facial recognition service app (SUCCESS)  @@@');
        resolve(d);
      },
      (e) => {
        log('@@@  Sent ADA to facial recognition service app (FAIL)  @@@', e);
        reject(e);
      }
    );
  });
}

const outgoingTopic = 'FaceRecInTopic';

async function findOutgoingServiceApp(): Promise<IFoundFriendApp> {
  return new Promise<IFoundFriendApp>(async (resolve, reject) => {
    log('@@@  Discovering Outgoing Face Recognition service app by topic...  @@@', outgoingTopic);
    const allFoundApps = await AtpTweetService.getInstance().findSharedApps([outgoingTopic]).catch((e) => {
      log('Cannot find Outgoing Face Recognition shared apps', e);
      reject(e);
    });
    if (!allFoundApps) {
      log('@@@  No shared app found by topic...  @@@', outgoingTopic);
      return;
    }
    const machineIP = (await AtpEnvironmentService.getInstance().getDeviceIP()).IP;
    const filteredApps = allFoundApps.filter((foundApp: IFoundFriendApp) => {
      return foundApp.EntityIp === machineIP;
    });
    log('@@@  Shared apps found by topic:  @@@', filteredApps);
    resolve(!!filteredApps.length ? filteredApps[0] : null);
  });
}
