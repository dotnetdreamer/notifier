import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';

const { GetAppInfo } = Plugins;
import * as moment from 'moment';

import { AppConstant } from '../shared/app-constant';
import { BaseService } from '../shared/base.service';
import { NotificationConstant } from './notification.constant';
import { INotificationIgnored } from './notification.model';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationIgnoredService extends BaseService {
    private readonly BASE_URL = "notification-ignored";

    constructor() {
        super();
    }

    pull() {
        return new Promise(async (resolve, reject) => {
            try {
                const items = await this.getNotifications({ sync: true });
                let allItems;

                if(!items.length) {
                    //no items found or don't have access on server, get local items and delete it!
                    allItems = await this.getAllLocal();
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

                //no items found ons server? don't proceed!
                if(!items.length) {
                    resolve();
                    return;
                }

                //now add
                await this.putAllLocal(items, true, true);

                resolve();
            } catch(e) {
                reject(e);
            }
        });
    }

    push() {
        return new Promise(async (resolve, reject) => {
            let unSycedLocal = await this.getUnSyncedLocal();
            if(AppConstant.DEBUG) {
                console.log('NotificationIgnoredService: sync: unSycedLocal items length', unSycedLocal.length);
            }

            //do not push same records again...
            unSycedLocal = unSycedLocal.filter(ul => this._findInQueue(ul) == -1);

            if(!unSycedLocal.length) {
                resolve();
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
                resolve();
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

                        const pItem: INotificationIgnored = cp[item.id];
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('NotificationIgnoredService: sync: complete');
                }
                // this.pubsubSvc.publishEvent(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<INotificationIgnored>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.notificationIgnored);

            const unSynced = [];
            let req = db.open(x => {
                let v: INotificationIgnored = x.getValue();
                if (v.markedForAdd || v.markedForUpdate || v.markedForDelete) {
                    unSynced.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(unSynced);
            });
        });
    }

    getNotifications(args?: { fromDate?, toDate?, sync? }) {
        let body;

        if(args && (args.fromDate || args.toDate )) {
            //change date to utc first
            if(args.fromDate) {
                const fromDate = moment(args.fromDate).endOf('D').utc()
                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                args.fromDate = fromDate;
            }
            if(args.toDate) {
                //if there is no time, add it...
                const toDate = moment(args.toDate).endOf('D').utc().format(AppConstant.DEFAULT_DATETIME_FORMAT);
                args.toDate = toDate;
            }
            
            body = { ...args };
        }
        return this.getData<INotificationIgnored[]>({
            url: `${this.BASE_URL}/getAll`,
            body: body
        });
    }

    getAllLocal(args?: { term?, pageIndex?, pageSize? })
        : Promise<INotificationIgnored[]> {
        return new Promise(async (resolve, reject) => {
            let results = [];
            const db = this.dbService.Db;
            // new ydn.db.IndexValueIterator(store, opt.key, key_range, (pageSize == 0 ? undefined : pageSize), (skip > 0 ? skip: undefined), false);
            //https://github.com/yathit/ydn-db/blob/8d217ba5ff58a1df694b5282e20ebc2c52104197/test/qunit/ver_1_iteration.js#L117
            //(store_name, key_range, reverse)
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.notificationIgnored);
            
            // let idx = 0;
            let req = db.open(x => {
                let v: INotificationIgnored = x.getValue();
                
                let item: INotificationIgnored;
                if(args) {
                    if(args.pageIndex || args.pageSize) {
                        item = v;
                    }

                    if(item && args.term) {
                        const term = args.term.toLowerCase();
                        const text = item ? item.text.toLowerCase() : v.text.toLowerCase();
                        
                        if(!(text.includes(term))) {
                            item = null;
                        }
                    }
                } else {
                    item = v;
                }

                if(item) {
                    //do not show deleted...
                    if(!item.markedForDelete) {
                        results.push(item);
                    }
                }

                req.done();
                // idx++;
                // console.log(idx);
            }, iter);
            req.always(async () => {
                results = this._sort(results);                    
                
                //check for pagesize
                if(args && args.pageSize && results.length > args.pageSize) {
                    const pageIndex = (args.pageIndex ? args.pageIndex - 1 : 0) * args.pageSize;
                    results = results.slice(pageIndex, args.pageSize);
                }

                results = await this._mapAll(results);
                resolve(results);
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<INotificationIgnored>(this.schemaSvc.tables.notificationIgnored, id);
    }

    async putLocal(item: INotificationIgnored, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
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

        return this.dbService.putLocal(this.schemaSvc.tables.notificationIgnored, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(NotificationConstant.EVENT_NOTIFICATION_IGNORED_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
        });
    }

    putAllLocal(items: INotificationIgnored[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const promises = [];

            for(let exp of items) {
                promises.push(this.putLocal(exp, ignoreFiringEvent, ignoreDefaults));
            }

            await Promise.all(promises);
            resolve();
        });
    }

    remove(id) {
        return this.dbService.remove(this.schemaSvc.tables.notificationIgnored, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.notificationIgnored);
    }

    private _addQueuePattern(items: INotificationIgnored[]) {
        items.map(item => {
            item['queuePattern'] = `${this.schemaSvc.tables.notificationIgnored}_${item.id}_${item.createdOn}`;
            return item;
        });
    }

    private _findInQueue(item: INotificationIgnored) {
        return this.findInQueue(`${this.schemaSvc.tables.notificationIgnored}_${item.id}_${item.createdOn}`);
    }

    private _mapAll(expenses: Array<INotificationIgnored>) {
        const result = expenses.map(async (e) => {
            const exp = await this._map(e);
            return exp;
        });
        return Promise.all(result);
    }

    private async _map(e: INotificationIgnored) {
        //only convert dates for data that came from server
        // if(!e.markedForAdd && !e.markedForUpdate && !e.markedForDelete) {
            e.createdOn = moment(e.createdOn).local(false).format(AppConstant.DEFAULT_DATETIME_FORMAT);
            if(e.updatedOn) {
                e.updatedOn = moment(e.updatedOn).local(false).format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
        // }
        return e;
    }

    private _sort(items: Array<INotificationIgnored>) {
        //by id first
        items.sort((a, b) => b.id - a.id);
        //then by date
        items = items.sort((aDate: INotificationIgnored, bDate: INotificationIgnored) => {
            return moment(bDate.createdOn).diff(aDate.createdOn);
        });

        return items;
    }
} 