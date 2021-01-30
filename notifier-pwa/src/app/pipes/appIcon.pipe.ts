import { Pipe, PipeTransform } from "@angular/core";
import { Plugins } from "@capacitor/core";

const { GetAppInfo } = Plugins;
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';

import { AppInfoService } from "../modules/app-info/app-info.service";

@Pipe({
    name: 'appIcon'
})
export class AppIconPipe implements PipeTransform {
    constructor(private appInfoSvc: AppInfoService) {
        
    }

    transform(pkg: string, ...args: any[]) {
        return new Promise(async (resolve, reject) => {
            if(!pkg) {
                resolve();
                return;
            }

            let icon;
            const info = await this.appInfoSvc.getByPackageLocal(pkg);
            console.log(pkg, info)
            if(info) {
                icon = info.image;
            }

            if(!icon) {
                //fallback
                try {
                    const result = await (<GetAppInfoPlugin>GetAppInfo).getAppIcon({
                        packageName: pkg
                    });
                    icon = result.value;
                } catch(e) {
                    //ignore...
                }
            }

            resolve(icon);
        });
    }
}