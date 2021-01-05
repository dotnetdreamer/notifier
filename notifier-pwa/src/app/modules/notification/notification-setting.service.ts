import { Injectable } from "@angular/core";

import { AppSettingService } from '../shared/app-setting.service';
import { NotificationConstant } from "./notification.constant";


@Injectable({
    providedIn: 'root'
})
export class NotificationSettingService extends AppSettingService {
    constructor() {
        super();
    }

    putIgnoreSystemAppsNotificationEnabled(value = true) {
        return this.dbService.putLocal(this.schemaSvc.tables.setting, {
            key: NotificationConstant.KEY_IGNORE_SYSTEM_APPS_NOTIFICATIONS,
            value: value == true ? 'yes' : 'no'
        }).then(() => {
            AppSettingService.settingCache.set(NotificationConstant.KEY_IGNORE_SYSTEM_APPS_NOTIFICATIONS, value);
        });
    }

    getIgnoreSystemAppsNotificationEnabled() {
        return this.get(NotificationConstant.KEY_IGNORE_SYSTEM_APPS_NOTIFICATIONS)
            .then(value => {
                if(typeof value === 'undefined' || value === null) {
                    return value;
                }
                return value == 'yes' || value == true;
            });    
    }
}