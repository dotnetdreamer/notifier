import {Injectable} from '@angular/core';
import {AppSettingService} from './app-setting.service';

@Injectable({
    providedIn: 'root'
})
export class LocalizationService {
    localizedStrings: any;
    constructor(private appSettingService: AppSettingService) {

    }

    getResource(keyString: string, workingLanguage?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let langPromise = null;
            if (workingLanguage) {
                langPromise = new Promise(resolve => resolve(workingLanguage));
            } else {
                langPromise = this.appSettingService.getWorkingLanguage();
            }
            langPromise.then(async workingLanguage => {
                workingLanguage = workingLanguage || 'en';

                if(!this.localizedStrings) {
                    await this.parseResourceFile(workingLanguage);
                }

                let resourceValue = null;
                if (this.localizedStrings.hasOwnProperty(keyString)) {
                    resourceValue = this.localizedStrings[keyString];
                } else {
                    resourceValue = this.getPropertyByKeyPath(this.localizedStrings, keyString);
                    // if(!resourceValue) {
                    //     debugger;
                    // }
                }
                if (resourceValue) {
                    resolve(resourceValue);
                } else {
                    resolve(keyString);
                }
            });
        });
    }

    async parseResourceFile(workingLanguage) {
        const resources = await import (`../../../assets/localization/localize-${workingLanguage}.json`);
        this.localizedStrings = resources.default;
    }
    
    private getPropertyByKeyPath(targetObj, keyPath) {
        var keys = keyPath.split('.');
        if (keys.length == 0) return undefined;
        keys = keys.reverse();
        var subObject = targetObj;
        while (keys.length) {
            var k = keys.pop();
            if (!subObject.hasOwnProperty(k)) {
                return undefined;
            } else {
                subObject = subObject[k];
            }
        }
        return subObject;
    }
}