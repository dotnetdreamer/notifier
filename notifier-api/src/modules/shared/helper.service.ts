import { Injectable } from "@nestjs/common";


@Injectable()
export class HelperService {
    isValidDate(date) {
        return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
    }

    //https://stackoverflow.com/a/2117523/859968
    generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    getRandomNumber() {
        const random = (new Date()).getTime() + Math.floor(Math.random() * 1000000);
        return random;
    }
}