import { Injectable } from '@angular/core';

import { SchemaService } from './schema.service';
import { AppConstant } from "../app-constant";
import { DbService } from './db-base.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

//configured in angular.json
declare var ydn: any;

@Injectable({
    providedIn: 'root' 
})
export class DbWebService implements DbService {
    private dbName: string = AppConstant.DB_NAME;
    private db: any;
    private _isDbInitialized = false;

    constructor(private schemaService: SchemaService, private pubsubSvc: NgxPubSubService) {
        const schema = { stores: [] };
        schemaService.schema.stores.forEach(s => {
            const pkCol = s.columns.filter(c => c.isPrimaryKey)[0];
            schema.stores.push({
                name: s.name,
                keyPath: pkCol.name,
                autoIncrement: pkCol.isPrimaryKey && pkCol.type == 'INTEGER'
            });
        });
        this.db = new ydn.db.Storage(this.dbName, schema);
        this.db.onReady((err) => {
            if (err) {
              alert(err);
              return;
            }
            this._isDbInitialized = true;
            this.initializeDb();
        });
    }

    initializeDb() {
        const delay = 50;
        //workaround: don't proceed unless db is initialized...wait everytime 50ms
        const _self = this;
        let timerId = setTimeout(function request() { 
            if (!_self._isDbInitialized) {
                //retry
                timerId = setTimeout(request, delay);
            } else {  
                //clear timeout
                clearTimeout(timerId);
                timerId = null;
                
                if(AppConstant.DEBUG) {
                    console.log('Event firing: EVENT_DB_INITIALIZED');
                }

                // heavy database operations should start from this...
                _self.pubsubSvc.publishEvent(AppConstant.EVENT_DB_INITIALIZED);
            }
        }, delay);
    }

    get Db() {
        return this.db;
    } 

    putLocal(store, data): Promise<{ rowsAffected, insertId }> {
        // const opts:YdnDbFilter = data;
        return new Promise((resolve, reject) => {
            // if (opts.key) {
            //     this.db.put(store, opts)
            //         .done(key => {
            //             resolve(key);
            //         });
            // } else {
            //     this.db.put(store, opts.value).done(key => {
            //         resolve(key);
            //     });
            // }
            this.db.put(store, data).done(key => {
                resolve(key);
            });
        });
    }

    putAll(store: string, opts: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let data = opts['value'];
            if (opts['key']) {
                this.db.putAll(store, opts)
                    .done(key => {
                        resolve(key);
                    });
            } else {
                this.db.putAll(store, data).done(key => {
                    resolve(key);
                });
            }
        });
    }

    get<T>(store: string, key: any): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.get(store, key).done(key => {
                resolve(<T>key);
            });
        });
    }

    getByFieldName(storeName, fieldName, key): Promise<Array<any>> {
        return this.getDynamic(storeName, {
            field: fieldName,
            operator: '=',
            value: key
        });
    }

    //http://dev.yathit.com/api/ydn/db/storage.html
    getAll<T>(store: string, opt?: YdnDbFilter): Promise<T> {
        return new Promise((resolve, reject) => {
            // added limit value of 10000 because YDN-DB default is 100
            // this.db.from(store).list(10000).done(function (results) {
            //     resolve(results);
            // })
            if (opt && opt.key && opt.value) {
                let key_range = ydn.db.KeyRange.only(opt.value);
                if(opt.keyRange) {
                    switch(opt.keyRange) {
                        case YdnDbKeyRangeType.startsWith:
                            key_range = ydn.db.KeyRange.starts(opt.value);
                        break;
                    } 
                }
                let iterator = new ydn.db.IndexValueIterator(store, opt.key, key_range);
                this.db.values(iterator).always((results) => {
                    resolve(results);
                });
            } else {
                // added limit value of 10000 because YDN-DB default is 100
                //Retrieve record values from a store.
                //values(store_name, key_range, limit, offset, reverse)
                this.db.values(store, null, 10000).always((results) => {
                    resolve(results);
                });
            }
        });
    }
    
    getDynamic(storeName, opts): Promise<Array<any>> {
        return new Promise((resolve, reject) => {
            let q;
            if (opts['field']) {
                q = this.db.from(storeName).where(opts['field'], opts['operator'], opts['value']);
            } else {
                q = this.db.from(storeName);
            }

            if (opts['top']) {
                q.list(opts['top']).done((result) => {
                    resolve(result)
                });
            } else {
                q.list(10000).done((result) => {
                    resolve(result);
                });
            }
        });
    }

    remove(store, key): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.remove(store, key).done((result) => {
                resolve(key);
            });
        });
    }

    removeAll(store) {
        return new Promise((resolve, reject) => {
            this.db.clear(store).done(result => {
                resolve(result);
            });
        });
    }

    count(store, opts?: { key }): Promise<number> {
        return new Promise((resolve, reject) => {
            if (opts && opts['key']) {
                this.db.count(store, ydn.db.KeyRange.only(opts['key'])).done(key => {
                    resolve(key);
                });
            } else {
                this.db.count(store).done(key => {
                    resolve(key);
                });
            }
        });
    }
    
    delete() {
        return new Promise((resolve, reject) => {
            ydn.db.deleteDatabase(AppConstant.DB_NAME);
            resolve();
        });
    }
}


export interface YdnDbFilter {
    key?: any
    value: any
    keyRange?: YdnDbKeyRangeType
}

export enum YdnDbKeyRangeType {
    equalto = 1,
    startsWith = 2
}