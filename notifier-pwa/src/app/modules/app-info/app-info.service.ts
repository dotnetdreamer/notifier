import { Injectable } from '@angular/core';

import * as moment from 'moment';

import { AppConstant } from '../shared/app-constant';
import { BaseService } from '../shared/base.service';
import { AppInfoConstant } from './app-info.constant';
import { EnvService } from '../shared/env.service';
import { IAppInfo } from './app-info.model';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class AppInfoService extends BaseService {
    private readonly BASE_URL = "app-info";

    constructor() {
        super();
    }

    pull() {
        return new Promise(async (resolve, reject) => {
            try {
                //chunks
                let allItems = [], items = [];

                let result = await this.getAppInfoList();
                items = result.data;

                if(!items.length) {
                    //no items found or don't have access on server, get local items and delete it!
                    allItems = (await this.getAllLocal()).data;
                } else {
                    allItems = items;
                }

                //local item marked for local changes i.e (delete, update or add) should be ignored...
                for(let i of allItems) {
                    const localItem = await this.getByIdLocal(i.id);
                    if(localItem 
                        && !(localItem && (localItem.markedForAdd || localItem.markedForUpdate || localItem.markedForDelete))) {
                        await this.remove(localItem.id);
                    }
                }

                //no items found on server? don't proceed!
                if(!items.length) {
                    resolve(null);
                    return;
                }

                //pre-sort
                items = this._sort(items);

                //now add
                await this.putAllLocal(items, true, true);

                resolve(null);
            } catch(e) {
                reject(e);
            }
        });
    }

    push() {
        return new Promise(async (resolve, reject) => {
            if(EnvService.DEBUG) {
                console.log('AppInfoService: push: started');
            }
            //chunks
            // let pageIndex = 1, pageSize = 10 , totalAvailable = 0;
            let unSycedLocal = [];
            //TODO: need to push with chunks
            const result = await this.getUnSyncedLocal({ pageIndex: 1, pageSize: 100 });
            unSycedLocal = result.data;
            if(EnvService.DEBUG) {
                console.log('AppInfoService: push: unSycedLocal items length', unSycedLocal.length);
            }

            //do not push same records again...
            unSycedLocal = unSycedLocal.filter(ul => this._findInQueue(ul) == -1);

            if(!unSycedLocal.length) {
                resolve(null);
                return;
            }
            
            //add to push queue
            this._addQueuePattern(unSycedLocal);

            let items: Array<any>;
            //server returns array of dictionary objects, each key in dict is the localdb id
            //we map the localids and update its serverid locally
            try {
                items = await this.postData<any[]>({
                    url: `${this.BASE_URL}/sync`,
                    body: unSycedLocal
                });
            } catch(e) {
                //try syncing 1 item at a time...
                for(let i=0; i < unSycedLocal.length; i++) {
                    const usItem = unSycedLocal[i];
                    try {
                        const returnedItems = await this.postData<any[]>({
                            url: `${this.BASE_URL}/sync`,
                            body: [usItem]  //server expects an array...
                        });
                        if(!items) {
                            items = [];
                        }
                        items.push(returnedItems[0]);
                    } catch(e) {
                        //remove it from queue
                        const index = unSycedLocal.indexOf(usItem);
                        unSycedLocal.splice(index, 1);
                        //reset i, as it didn't succeed
                        i--;
                        continue;
                    }
                }
            }

            //something bad happend or in case of update, we don't need to update server ids
            if(items == null) {
                resolve(null);
                return;
            }
            
            try {
                const promises = [];
                //mark it
                for (let item of unSycedLocal) {
                    if (item.markedForAdd || item.markedForUpdate) {
                        //update server id as well...
                        const cp = items.filter(p => p[item.id])[0];
                        if(!cp) {
                            throw `Local item mapping not found for: ${item.id}`;
                        }

                        //removed old items whose ids are changed e.g in adding senario
                        //we remove the item immedialty as it causes issue when we run update promise down
                        await this.remove(item.id);

                        const pItem: IAppInfo = cp[item.id];
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(EnvService.DEBUG) {
                    console.log('AppInfoService: sync: complete');
                }
                // this.pubsubSvc.publishEvent(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED);
                resolve(null);
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(args?: { pageIndex?, pageSize? })
        : Promise<{ data: IAppInfo[], total: number }> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.appInfo);

            if(!args) {
                args = {};
            }

            if(!args.pageIndex) {
                args.pageIndex = 1;
            }

            if(!args.pageSize) {
                args.pageSize = AppConstant.MAX_PAGE_SIZE;
            }

            const unSynced = [];
            const total = await this.count();
            const skip = (args.pageIndex - 1) * args.pageSize;
            let idx = 0;

            let req = db.open(x => {
                idx++;

                if(idx <= skip) {
                    req.done();
                    return;
                }

                if(unSynced.length == args.pageSize || skip >= total) {
                    req.done();
                    return { advance: 2 };
                }

                let v: IAppInfo = x.getValue();
                if (v.markedForAdd || v.markedForUpdate || v.markedForDelete) {
                    unSynced.push(v);
                }
            }, iter);
            req.always(() => {
                resolve({
                    data: unSynced,
                    total: total
                });
            });
        });
    }

    getAppInfoList(args?: { fromDate?, toDate? }) {
        let body;

        if(!args) {
            args = {};
        }

        if(args.fromDate || args.toDate ) {
            //change date to utc first
            if(args.fromDate) {
                const fromDate = moment(args.fromDate).utc(false).endOf('D')
                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                args.fromDate = fromDate;
            }
            if(args.toDate) {
                //if there is no time, add it...
                const toDate = moment(args.toDate).utc(false).endOf('D').format(AppConstant.DEFAULT_DATETIME_FORMAT);
                args.toDate = toDate;
            }
            
            body = { ...args };
        }
        
        return this.getData<{ total: number, data: IAppInfo[] }>({
            url: `${this.BASE_URL}/getAll`,
            body: body
        });
    }

    getAllLocal(args?: { fromDate?, toDate?, pageIndex?, pageSize? })
        : Promise<{ total:number, data: IAppInfo[]}> {
        return new Promise(async (resolve, reject) => {
            let results = [], total = 0;
            const db = this.dbService.Db;
            // new ydn.db.IndexValueIterator(store, opt.key, key_range, (pageSize == 0 ? undefined : pageSize), (skip > 0 ? skip: undefined), false);
            //https://github.com/yathit/ydn-db/blob/8d217ba5ff58a1df694b5282e20ebc2c52104197/test/qunit/ver_1_iteration.js#L117
            //(store_name, key_range, reverse)
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.appInfo);
            
            if(!args) {
                args = {};
            }

            if(!args.pageIndex) {
                args.pageIndex = 1;
            }

            if(!args.pageSize) {
                args.pageSize = AppConstant.MAX_PAGE_SIZE;
            }

            total = await this.count();
            const skip = (args.pageIndex - 1) * args.pageSize;
            let idx = 0;
            const req = db.open(x => {
                idx++;

                if(idx <= skip) {
                    req.done();
                    return;
                }

                if(results.length == args.pageSize || skip >= total) {
                    req.done();
                    return { advance: 2 };
                }

                let v: IAppInfo = x.getValue();
                let item: IAppInfo;
                if(args) {
                    if(args.fromDate && args.toDate) {
                        //change date to utc first
                        const fromDateCreatedOnUtc = moment.utc(args.fromDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                        const createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);
                        const toDateCreatedOnUtc = moment.utc(args.toDate).format(AppConstant.DEFAULT_DATE_FORMAT);;

                        if(createdOnUtc >= fromDateCreatedOnUtc 
                            && createdOnUtc <= toDateCreatedOnUtc) {
                            item = v;
                        }
                    }
                } else {
                    item = v;
                }

                if(item) {
                    //do not show deleted...
                    if(!item.markedForDelete) {
                        results.push(item);
                    } else {
                        //decrease back the idx as item was deleted
                        idx--;
                    }
                }

                req.done();
                // console.log(idx);

                // return { advance: 2}
            }, iter, 'readonly');
            req.always(async () => {
                // results = this._sort(results);                    
                
                //check for pagesize
                // if(args && args.pageSize && results.length > args.pageSize) {
                //     const pageIndex = (args.pageIndex ? args.pageIndex - 1 : 0) * args.pageSize;
                //     results = results.slice(pageIndex, args.pageSize);
                // }

                results = await this._mapAll(results);
                resolve({ total: total, data: results });
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<IAppInfo>(this.schemaSvc.tables.appInfo, id);
    }

    async getByPackageLocal(pckage) {
        const info = await this.dbService.getByFieldName<IAppInfo>(
            this.schemaSvc.tables.appInfo, 'package', pckage);

        return <IAppInfo>info[0];
    }

    addOrUpdate(item: IAppInfo, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const toAdd = await this.getByPackageLocal(item.package);
            if(toAdd) {
                resolve(null);
                return;
            }

            try {
                const result = await this.putLocal(item, ignoreFiringEvent, ignoreDefaults);
                resolve(result);
            } catch(e) {
                reject(e);
            }
        });
    }

    async putLocal(item: IAppInfo, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        //defaults
         if(!ignoreDefaults) {
            if(typeof item.markedForAdd === 'undefined' 
                && typeof item.markedForUpdate === 'undefined' 
                && typeof item.markedForDelete === 'undefined') {
                item.markedForAdd = true;
            }

            if(item.markedForAdd && !item.createdOn) {
                item.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            } else if((item.markedForUpdate || item.markedForDelete) && !item.updatedOn) {
                item.updatedOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }

            //added item can't be marked for update or delete...
            if((item.markedForAdd && item.markedForUpdate) || (item.markedForAdd && item.markedForDelete)) {
                item.markedForUpdate = false;
                item.markedForDelete = false;
            }
        }

        let createdOn;
        //if there is no time, add it...
        const crOnTime = moment(item.createdOn).format(AppConstant.DEFAULT_TIME_FORMAT) != '00:00';
        if(!crOnTime) {
            createdOn = `${item.createdOn} ${moment().format(AppConstant.DEFAULT_TIME_FORMAT + ":ss")}`;
        } else {
            createdOn = item.createdOn;
        }
        //to utc
        item.createdOn = moment(createdOn).utc().toISOString();
        if(item.updatedOn) {
            item.updatedOn = moment(item.updatedOn).utc().toISOString();
        }

        return this.dbService.putLocal(this.schemaSvc.tables.appInfo, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(AppInfoConstant.EVENT_APP_INFO_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
        });
    }

    putAllLocal(items: IAppInfo[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const promises = [];

            for(let appInfo of items) {
                promises.push(this.putLocal(appInfo, ignoreFiringEvent, ignoreDefaults));
            }

            await Promise.all(promises);
            resolve(null);
        });
    }

    remove(id) {
        return this.dbService.remove(this.schemaSvc.tables.appInfo, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.appInfo);
    }

    count() {
        return this.dbService.count(this.schemaSvc.tables.appInfo);
    }

    private _addQueuePattern(items: IAppInfo[]) {
        items.map(item => {
            item['queuePattern'] = `${this.schemaSvc.tables.appInfo}_${item.id}_${item.createdOn}`;
            return item;
        });
    }

    private _findInQueue(item: IAppInfo) {
        return this.findInQueue(`${this.schemaSvc.tables.appInfo}_${item.id}_${item.createdOn}`);
    }

    private _mapAll(appInfoList: Array<IAppInfo>) {
        const result = appInfoList.map(async (e) => {
            const appInfo = await this._map(e);
            return appInfo;
        });
        return Promise.all(result);
    }

    private async _map(e: IAppInfo) {
        //only convert dates for data that came from server
        // if(!e.markedForAdd && !e.markedForUpdate && !e.markedForDelete) {
            e.createdOn = moment(e.createdOn).local(false).format(AppConstant.DEFAULT_DATETIME_FORMAT);
            if(e.updatedOn) {
                e.updatedOn = moment(e.updatedOn).local(false).format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
        // }

        return e;
    }

    private _sort(items: Array<IAppInfo>) {
        //by id first
        items.sort((a, b) => b.id - a.id);
        //then by date
        items = items.sort((aDate: IAppInfo, bDate: IAppInfo) => {
            return moment(bDate.createdOn).diff(aDate.createdOn);
        });

        return items;
    }
}