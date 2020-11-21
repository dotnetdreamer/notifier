import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';

const { GetAppInfo } = Plugins;
import * as moment from 'moment';
import { GetAppInfoPlugin } from 'capacitor-plugin-get-app-info';

import { AppConstant } from '../shared/app-constant';
import { BaseService } from '../shared/base.service';
import { NotificationConstant } from './notification.constant';
import { INotification } from './notification.model';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationService extends BaseService {
    private readonly BASE_URL = "notification";

    constructor() {
        super();
    }

    pull() {
        return new Promise(async (resolve, reject) => {
            try {
                //by default fetch 90 days records only
                const fromDate = moment().add(-90, 'days').format(AppConstant.DEFAULT_DATE_FORMAT);
                const items = await this.getNotifications({ fromDate: fromDate, sync: true });
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
                console.log('NotificationService: sync: unSycedLocal items length', unSycedLocal.length);
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

                        const pItem: INotification = cp[item.id];
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('NotificationService: sync: complete');
                }
                // this.pubsubSvc.publishEvent(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<INotification>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.notification);

            const unSynced = [];
            let req = db.open(x => {
                let v: INotification = x.getValue();
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
        return this.getData<INotification[]>({
            url: `${this.BASE_URL}/getAll`,
            body: body
        });
    }

    getAllLocal(args?: { term?, fromDate?, toDate?, fromTime?, toTime?, pageIndex?, pageSize? })
        : Promise<INotification[]> {
        return new Promise(async (resolve, reject) => {
            let results = [];
            const db = this.dbService.Db;
            // new ydn.db.IndexValueIterator(store, opt.key, key_range, (pageSize == 0 ? undefined : pageSize), (skip > 0 ? skip: undefined), false);
            //https://github.com/yathit/ydn-db/blob/8d217ba5ff58a1df694b5282e20ebc2c52104197/test/qunit/ver_1_iteration.js#L117
            //(store_name, key_range, reverse)
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.notification);
            
            // let idx = 0;
            let req = db.open(x => {
                let v: INotification = x.getValue();
                
                let item: INotification;
                if(args) {
                    if(args.fromDate || args.toDate) {
                        const createdOnUtcStr = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);

                        if(args.fromDate && args.toDate) {
                            //change date to utc first
                            let fromDateCreatedOnUtc, toDateCreatedOnUtc, createdOnUtc;

                            if(args.fromTime) {
                                const fromTime = moment.utc(args.fromTime, AppConstant.DEFAULT_TIME_FORMAT)
                                    .format(AppConstant.DEFAULT_TIME_FORMAT)
                                    .split(':')
                                    .map(t => +t);
                                fromDateCreatedOnUtc = moment(args.fromDate)
                                    .set('hour', fromTime[0])
                                    .set('minute', fromTime[1])
                                    // .set('second', 0)
                                    .utc()
                                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATETIME_FORMAT);
                            } else {
                                fromDateCreatedOnUtc = moment.utc(args.fromDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);
                            }

                            if(args.toTime) {
                                const toTime = moment.utc(args.toTime, AppConstant.DEFAULT_TIME_FORMAT)
                                    .format(AppConstant.DEFAULT_TIME_FORMAT)
                                    .split(':')
                                    .map(t => +t);
                                toDateCreatedOnUtc = moment.utc(args.toDate)
                                    .set('hour', toTime[0])
                                    .set('minute', toTime[1])
                                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATETIME_FORMAT);
                            } else {
                                toDateCreatedOnUtc = moment.utc(args.toDate).format(AppConstant.DEFAULT_DATE_FORMAT);;
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);
                            }

                            if(createdOnUtc >= fromDateCreatedOnUtc 
                                && createdOnUtc <= toDateCreatedOnUtc) {
                                item = v;
                            }
                        } else if (args.fromDate) {
                            //change date to utc first
                            const fromDateCreatedOnUtc = moment.utc(args.fromDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                            if(createdOnUtcStr >= fromDateCreatedOnUtc) {
                                item = v;
                            }
                        } else if (args.toDate) {
                            //change date to utc first
                            const toDateCreatedOnUtc = moment.utc(args.toDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                            if(createdOnUtcStr <= toDateCreatedOnUtc) {
                                item = v;
                            } 
                        }
                    }

                    if(item && args.term) {
                        const term = args.term.toLowerCase();
                        const title = item ? item.title.toLowerCase() : v.title.toLowerCase();
                        const text = item ? item.text.toLowerCase() : v.text.toLowerCase();
                        
                        if(!title.includes(term) && !(text.includes(term))) {
                            item = null;
                        }
                    }

                    // if(item) {
                    //     //either show grouped or non-grouped or explicilty set groupId to null (e.g in dashboard)
                    //     if(args.groupId) {
                    //         if(!item.group) {
                    //             item = null;
                    //         } else if(item.group.id != args.groupId) {
                    //             item = null;
                    //         }
                    //     } else if(args.groupId === null) {
                    //         //do not show goruped items if null is passed
                    //         if(item.group) {
                    //             item = null;
                    //         }
                    //     }
                    // }
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
                results = await this._mapAll(results);
                results = this._sort(results);                    
                
                //check for pagesize
                if(args && args.pageSize && results.length > args.pageSize) {
                    results = results.slice(0, args.pageSize);
                }
                resolve(results);
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<INotification>(this.schemaSvc.tables.notification, id);
    }

    async putLocal(item: INotification, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
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

        return this.dbService.putLocal(this.schemaSvc.tables.notification, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(NotificationConstant.EVENT_NOTIFICATION_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
        });
    }

    putAllLocal(items: INotification[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
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
        return this.dbService.remove(this.schemaSvc.tables.notification, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.notification);
    }

    private _addQueuePattern(items: INotification[]) {
        items.map(item => {
            item['queuePattern'] = `${this.schemaSvc.tables.notification}_${item.id}_${item.createdOn}`;
            return item;
        });
    }

    private _findInQueue(item: INotification) {
        return this.findInQueue(`${this.schemaSvc.tables.notification}_${item.id}_${item.createdOn}`);
    }

    private _mapAll(expenses: Array<INotification>) {
        const result = expenses.map(async (e) => {
            const exp = await this._map(e);
            return exp;
        });
        return Promise.all(result);
    }

    private async _map(e: INotification) {
        //only convert dates for data that came from server
        // if(!e.markedForAdd && !e.markedForUpdate && !e.markedForDelete) {
            e.createdOn = moment(e.createdOn).local().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            if(e.updatedOn) {
                e.updatedOn = moment(e.updatedOn).local().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
        // }

        //icon
        try {
            const imgRslt = await (<GetAppInfoPlugin>GetAppInfo).getAppIcon({
                packageName: e.package
            });
            if(imgRslt.value) {
                // e.image = `url('${imgRslt.value}')`;
                e.image = imgRslt.value;
            }
        } catch(e) {
            //ignore...
        }

        //app name
        try {
            const appName = await (<GetAppInfoPlugin>GetAppInfo).getAppLabel({
                packageName: e.package
            });
            if(appName.value) {
                // e.image = `url('${imgRslt.value}')`;
                e.appName = appName.value;
            }
        } catch(e) {
            //ignore...
        }
        return e;
    }

    private _sort(items: Array<INotification>) {
        // expenses.sort((aDate: INotification, bDate: INotification) => {
        //     // Turn your strings into dates, and then subtract them
        //     // to get a value that is either negative, positive, or zero.
        //     const a = moment(`${aDate.createdOn} ${aDate.createdOn}`, AppConstant.DEFAULT_DATETIME_FORMAT);
        //     const b = moment(`${bDate.createdOn} ${bDate.createdOn}`, AppConstant.DEFAULT_DATETIME_FORMAT);

        //     //The following also takes seconds and milliseconds into account and is a bit shorter.
        //     return b.valueOf() - a.valueOf();
        // });
        
        //by id first
        items.sort((a, b) => b.id - a.id);
        //then by date
        items = items.sort((aDate: INotification, bDate: INotification) => {
            return moment(bDate.createdOn).diff(aDate.createdOn);
        });

        return items;
    }
}