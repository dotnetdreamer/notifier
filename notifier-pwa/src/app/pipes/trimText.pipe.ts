import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name:"trimText"
})
export class TrimTextPipe implements PipeTransform {
    constructor() {

    }

    transform(text: string, length: number) {
        if(!text) {
            return;
        }

        if(!text.trim()) {
            return;
        }

        if(text.length < length) {
            return text;
        }

        const newTxt = text.substr(0, length);
        return newTxt + '...';
    }
}