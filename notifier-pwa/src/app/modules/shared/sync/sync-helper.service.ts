import { Injectable } from "@angular/core";

import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

import { SyncEntity } from './sync.model';
import { SyncConstant } from './sync-constant';
import { AppConstant } from '../app-constant';
import { NotificationService } from '../../notification/notification.service';
import { NotificationIgnoredService } from '../../notification/notification-ignored.service';


@Injectable({
    providedIn: 'root'
})
export class SyncHelperService {
    constructor(private pubsubSvc: NgxPubSubService
        , private notificationSvc: NotificationService
        , private notificationIgnoredSvc: NotificationIgnoredService) {
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
                    default:
                    break;
                }
            } else {   //sync all
                //notification
                promises.push(this.notificationSvc.pull());
                //notification ignored
                promises.push(this.notificationIgnoredSvc.pull());
            }
            
            try {
                await Promise.all(promises);
                resolve();
            } catch(e) {
                reject(e);
            } finally {
                if(AppConstant.DEBUG) {
                    console.log('SyncHelperService: publishing EVENT_SYNC_DATA_PULL_COMPLETE');
                }
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE);
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
                    default:
                    break;
                }
            } else {   //sync all
                //notification
                promises.push(this.notificationSvc.push());

                //notification ignored
                promises.push(this.notificationIgnoredSvc.push());
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

    }
}