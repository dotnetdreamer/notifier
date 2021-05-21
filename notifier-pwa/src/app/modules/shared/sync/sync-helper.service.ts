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
        , private NotificationRecordSvc: NotificationService
        , private NotificationIgnoredItemSvc: NotificationIgnoredService
        , private AppInfoSvc: AppInfoService) {

            
        const injector = AppInjector.getInjector();
        this.baseSvc = injector.get(BaseService);
    }

    check(args: ISyncItem[]) {
        // if(!args) {
        //     args = <any>{};
        // }

        // if(!args.dateFrom) {
        //     args.dateFrom = moment().utc(true).format(AppConstant.DEFAULT_DATETIME_FORMAT);
        // }


        // const lastUpdated = appSettingSvc.getWorkingLanguage();
        return this.baseSvc.postData<{ total: number, data: ISyncItem[] }>({
            url: `${this.BASE_URL}/getAll`,
            body: args
        });
    }

    pull(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            if(SyncHelperService.pullingInProgress) {
                resolve();
                return;
            }

            const fullRequest: Array<{ table: string, promise: Promise<any> }> = [];
            SyncHelperService.pullingInProgress = true;
            if(table) {
                fullRequest.push({ table: table, promise: this[`${table}Svc`].pull() });
            } else {   //sync all
                let tablesToCheck = <string[]>[];

                const allLocalTables = await this._getAllLocal();
                if(!allLocalTables.length) {    //check all
                    tablesToCheck = [
                        SyncEntity.NOTIFICATION_RECORD
                        , SyncEntity.NOTIFICATION_IGNORED_ITEM
                        , SyncEntity.APP_INFO
                    ];
                } else {    //check the one that has been updated
                    const checkRes = await this.check(allLocalTables);
                    if(checkRes.total > 0) {
                        tablesToCheck = checkRes.data.map(t => t.tableName);
                    }
                }

                for(let d of tablesToCheck) {
                    // promises.push(this[`${d.tableName}_SVC`].pull());
                    fullRequest.push({ table: d, promise: this[`${d}Svc`].pull() });
                }
            }

            try {
                const promises = fullRequest.map(r => r.promise);
                await Promise.all(promises);
                
                const tables = fullRequest.map(r => r.table);
                for(let t of tables) {
                    let lt = await this._getByNameLocal(t);
                    if(!lt) {
                        lt = {
                            tableName: t,
                            updatedOn: null
                        };
                    }
                    
                    lt.updatedOn = moment().utc(false)
                        .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                    await this._putLocal(lt);
                }
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
                    case SyncEntity.NOTIFICATION_RECORD:
                        promises.push(this.NotificationRecordSvc.push());
                    break;
                    case SyncEntity.NOTIFICATION_IGNORED_ITEM:
                        promises.push(this.NotificationIgnoredItemSvc.push());
                    break;
                    case SyncEntity.APP_INFO:
                        promises.push(this.AppInfoSvc.push());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //notification
                promises.push(this.NotificationRecordSvc.push());
                //notification ignored
                promises.push(this.NotificationIgnoredItemSvc.push());
                //app-info
                promises.push(this.AppInfoSvc.push());
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

            await this.NotificationIgnoredItemSvc.putAllLocal(newItems, true, false);
            resolve();
        });
    }

    
    private _getAllLocal() {
        return this.baseSvc.dbService.getAll<ISyncItem[]>(this.baseSvc.schemaSvc.tables.syncItem);
    }

    private _getByNameLocal(tableName) {
        return this.baseSvc.dbService.get<ISyncItem>(this.baseSvc.schemaSvc.tables.syncItem, tableName);
    }

    private _putLocal(data: ISyncItem) {
        return this.baseSvc.dbService.putLocal(this.baseSvc.schemaSvc.tables.syncItem, data);
    }
}