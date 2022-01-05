import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextProcessorService {

    private readonly replaceMap = {
        '|': '<br/>'
    };

    constructor() {}

    public processText(input: string, args: any = null): string {
        try {
            Object.keys(this.replaceMap).forEach(key => {
                input = input.replaceAll(key, this.replaceMap[key]);
            });
        } catch (error) {
            console.log('error when replace text: {0}', error);
        }
        return input;
    }
}
