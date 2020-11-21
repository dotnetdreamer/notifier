import { Pipe } from '@angular/core';
import { LocalizationService } from '../modules/shared/localization.service';


@Pipe({
  name:"localizedresource"
})
export class LocalizedResourcePipe {
    constructor(private localizationService: LocalizationService) {

    }

    transform(resourceKey: string, workingLanguage?: string) {
        return new Promise((resolve, reject) => {
            if(!resourceKey) {
                resolve();
            } else {
                this.localizationService.getResource(resourceKey, workingLanguage)
                .then((value) => {
                    resolve(value); 
                });
            }
        });
    }
}