import { Injectable } from "@angular/core";
import { Plugins } from "@capacitor/core";

const { Device } = Plugins;
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import * as moment from 'moment';

import { ISyncItem, SyncEntity } from './sync.model';
import { SyncConstant } from './sync-constant';
import { AppConstant } from '../app-constant';
import { NotificationService } from '../../notification/notification.service';
import { NotificationIgnoredService } from '../../notification/notification-ignored.service';
import { INotificationIgnored } from '../../notification/notification.model';
import { EnvService } from "../env.service";
import { AppInfoService } from "../../app-info/app-info.service";
import { AppInjector } from "../app-injector";
import { BaseService } from "../base.service";
import { DbService } from "../db/db-base.service";
import { SchemaService } from "../db/schema.service";


@Injectable({
    providedIn: 'root'
})
export class SyncHelperService {
    public static pushingInProgress = false;
    public static pullingInProgress = false;

    private readonly BASE_URL = "sync";
    private readonly baseSvc: BaseService;

    constructor(private pubsubSvc: NgxPubSubService
        , private notificationSvc: NotificationService
        , private notificationIgnoredSvc: NotificationIgnoredService
        , private appInfoSvc: AppInfoService) {

            
        const injector = AppInjector.getInjector();
        this.baseSvc = injector.get(BaseService);
    }

    check(dateTime?) {
        if(!dateTime) {
            dateTime = moment().local(true).utc().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }


        // const lastUpdated = appSettingSvc.getWorkingLanguage();
        return this.baseSvc.getData<{ total: number, data: any }>({
            url: `${this.BASE_URL}/getAll`,
            body: {
                dateFrom: dateTime
            }
        });
    }

    pull(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            if(SyncHelperService.pullingInProgress) {
                resolve();
                return;
            }

            const promises: Array<Promise<any>> = [];
            SyncHelperService.pullingInProgress = true;
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
                // const tables = [
                //     this._getByNameLocal('NotificationRecord')
                // ];
                // const d = await Promise.all(tables);
                // debugger;
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
                SyncHelperService.pullingInProgress = false;
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, table);
            }
        });
    }
    
    push(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            if(SyncHelperService.pushingInProgress) {
                resolve();
                return;
            }

            SyncHelperService.pushingInProgress = true;
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
                SyncHelperService.pushingInProgress = false;
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

            //current app
            const deviceInfo = await Device.getInfo();
            const currentAppItem: INotificationIgnored = {
                text: deviceInfo.appId,
                package: deviceInfo.appId,
                silent: false,  //display notifications popup in statusbar when app goes to background
                markedForAdd: true
            };
            newItems.push(currentAppItem);

            await this.notificationIgnoredSvc.putAllLocal(newItems, true, false);
            resolve();
        });
    }

    
    private _getByNameLocal(tableName) {
        return this.baseSvc.dbService.get<ISyncItem>(this.baseSvc.schemaSvc.tables.syncItem, tableName);
    }
}