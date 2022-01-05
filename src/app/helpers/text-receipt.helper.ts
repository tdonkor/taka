import { log } from './log.helper';

const replaceMap = {
  '<br/>': '\n',
};

export function getMultipleLineText(input: string): string {
  try {
    Object.keys(replaceMap).forEach((key) => {
      input = input.replaceAll(key, replaceMap[key]);
    });
  } catch (error) {
    log('error when replace text: {0}', error);
  }
  return input;
}
