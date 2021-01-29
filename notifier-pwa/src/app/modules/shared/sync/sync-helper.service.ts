import { Injectable } from "@angular/core";
import { Plugins } from "@capacitor/core";

const { GetAppInfo } = Plugins;
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';

import { SyncEntity } from './sync.model';
import { SyncConstant } from './sync-constant';
import { AppConstant } from '../app-constant';
import { NotificationService } from '../../notification/notification.service';
import { NotificationIgnoredService } from '../../notification/notification-ignored.service';
import { INotification, INotificationIgnored } from '../../notification/notification.model';
import { EnvService } from "../env.service";
import { AppInfoService } from "../../app-info/app-info.service";


@Injectable({
    providedIn: 'root'
})
export class SyncHelperService {
    constructor(private pubsubSvc: NgxPubSubService
        , private notificationSvc: NotificationService
        , private notificationIgnoredSvc: NotificationIgnoredService
        , private appInfoSvc: AppInfoService) {
    }

    pull(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            const promises: Array<Promise<any>> = [];

            if(table) {
                switch(table) {
                    case SyncEntity.NOTIFICATION:
                        promises.push(this.notificationSvc.pull());
                    break;
                    case SyncEntity.NOTIFICATION_IGNORED:
                        promises.push(this.notificationIgnoredSvc.pull());
                    break;
                    case SyncEntity.APP_INFO:
                        promises.push(this.appInfoSvc.pull());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //notification
                promises.push(this.notificationSvc.pull());
                //notification ignored
                promises.push(this.notificationIgnoredSvc.pull());
                //app-info
                promises.push(this.appInfoSvc.pull());
            }
            
            try {
                await Promise.all(promises);
                resolve();
            } catch(e) {
                reject(e);
            } finally {
                if(EnvService.DEBUG) {
                    console.log('SyncHelperService: publishing EVENT_SYNC_DATA_PULL_COMPLETE');
                }
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, table);
            }
        });
    }
    
    push(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            let promises: Array<Promise<any>> = [];
            if(table) {
                switch(table) {
                    case SyncEntity.NOTIFICATION:
                        promises.push(this.notificationSvc.push());
                    break;
                    case SyncEntity.NOTIFICATION_IGNORED:
                        promises.push(this.notificationIgnoredSvc.push());
                    break;
                    case SyncEntity.APP_INFO:
                        promises.push(this.appInfoSvc.push());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //notification
                promises.push(this.notificationSvc.push());
                //notification ignored
                promises.push(this.notificationIgnoredSvc.push());
                //app-info
                promises.push(this.appInfoSvc.push());
            }
            
            if(!promises.length) {
                resolve();
                return;
            }

            try {
                await Promise.all(promises);
                resolve();
            } catch (e) {
                resolve(e);
            } finally {
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, promises.length);
            }
        });
    }


    syncSampleData() {
        return new Promise(async (resolve, reject) => {
            const packages = AppConstant.IGNORED_PACKAGES;
            const newItems: INotificationIgnored[] = [];

            for(let p of packages) {
                const item: INotificationIgnored = {
                    text: p,
                    package: p,
                    silent: true,
                    markedForAdd: true
                };
                newItems.push(item);
            }
            await this.notificationIgnoredSvc.putAllLocal(newItems, true, false);
            resolve();
        });
    }
}