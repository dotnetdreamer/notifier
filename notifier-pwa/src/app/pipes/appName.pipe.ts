import { Pipe, PipeTransform } from "@angular/core";

import { GetAppInfo } from 'capacitor-plugin-get-app-info';

import { AppInfoService } from "../modules/app-info/app-info.service";

@Pipe({
    name: 'appName'
})
export class AppNamePipe implements PipeTransform {
    constructor(private appInfoSvc: AppInfoService) {

    }

    transform(pkg: string, ...args: any[]) {
        return new Promise(async (resolve, reject) => {
            if(!pkg) {
                resolve(null);
                return;
            }

            let name;
            const info = await this.appInfoSvc.getByPackageLocal(pkg);
            if(info) {
                name = info.appName;
            }

            if(!name) {
                //fallback
                try {
                    const result = await GetAppInfo.getAppLabel({
                        packageName: pkg
                    });
                    name = result.value;
                } catch(e) {
                    //ignore...
                }
            }

            resolve(name);
        });
    }
}