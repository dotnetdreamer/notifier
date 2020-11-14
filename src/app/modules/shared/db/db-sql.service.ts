import { Injectable } from '@angular/core';

import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
// import * as CapacitorSQLPlugin from 'capacitor-sqlite';
const { CapacitorSQLite } = Plugins;

import { SchemaService, ITableOptions } from './schema.service';
import { AppConstant } from "../app-constant";
import { DbService } from './db-base.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Injectable({
    providedIn: 'root'
})
export class DbSqlService implements DbService {
    private _dbName: string = AppConstant.DB_NAME;
    private _db: any;
    private _isDbInitialized = false;

    constructor(private platform: Platform
        , private pubsubSvc: NgxPubSubService, private schemaSvc: SchemaService) {
            this.platform.ready().then(async () => {
                // await this._deleteDatabase();
                this._db = CapacitorSQLite;
                console.log('db', this._db);
                try {
                    let response: { result:boolean, message:string } = await this._db.open({ database: this._dbName });
                    if(response.result) {
                        await this._dbSuccess();

                        this.initializeDb();
                    }
                } catch (e) {
                    this._dbError(e);
                }
            });
    }

    testDb() {
        this._db.transaction((tr) => {
            tr.executeSql('SELECT upper(?) AS upperString', ['Test string'], (tr, rs) => {
                console.log('Got upperString result: ' + rs.rows.item(0).upperString);
            });
        }); 
    }
 
    initializeDb() {   
        const delay = 50;
        //workaround: don't proceed unless db is initialized...wait everytime 50ms
        const _self = this;
        let timerId = setTimeout(async function request() { 
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

                await _self._prepareTables();
        
                // heavy database operations should start from this...
                _self.pubsubSvc.publishEvent(AppConstant.EVENT_DB_INITIALIZED);
            }
        }, delay);
    }

    get Db() {
        return this._db;
    } 

    putLocal(store, data): Promise<{ rowsAffected, insertId }> {
        return new Promise(async (resolve, reject) => {
            let sql = `BEGIN TRANSACTION;`;
            const values = [];
            
            const total = await this.count(store);
            if(total) {
                //update
                sql = `UPDATE ${store} SET `;
                //columns
                for(let prop in data) {
                    if(data.hasOwnProperty(prop)) {
                        sql += `${prop}='${data[prop]}',`;
                    }
                }
                //remove extra ',' at the end
                sql = sql.substr(0, sql.length - 1);
            } else {
                //insert
                sql = `INSERT INTO ${store} `;
                //columns
                sql += `(`;
                for(let prop in data) {
                    if(data.hasOwnProperty(prop)) {
                        sql += `${prop},`;
                    }
                }
                //remove extra ',' at the end
                sql = sql.substr(0, sql.length - 1);
                sql += `)`;

                //values
                sql += ` VALUES (`;
                for(let prop in data) {
                    sql += `?,`;
                    values.push(data[prop]);
                }
                sql = sql.substr(0, sql.length - 1);
                sql += `)`;
            }

            sql += `COMMIT TRANSACTION;`;

            if(AppConstant.DEBUG) {
                console.log('DbService: put: sql:', sql);
            }     

            const { changes } = await this._db.execute({ statements:sql, values: values });
            resolve(changes);
            // this._db.transaction(async (tx) => {           
            //     const res = await this._executeSql<{ rowsAffected, insertId }>(tx, sql, values);
            //     resolve(res);
            // }, (error) => reject(error));
        });
    }

    get<T>(store: string, key: any): Promise<T> {
        return new Promise(async (resolve, reject) => {
            //get primary key field form schema
            const table:any = this.schemaSvc.schema.stores.filter(s => s.name === store)[0];
            const pk = (table.columns.filter(c => c.isPrimaryKey)[0]);
            const pkName = pk.name;

            let sql = `SELECT * FROM ${store} WHERE ${pkName} = '${key}' LIMIT 1`;
            try {
                let data;
                const { values } = await this._db.query({ statement:sql, values:[] });
                if(values.length) {
                    data = values[0];
                }
                resolve(data);
            } catch(e) {
                reject(e);
            }
        });
    }

    getAll<T>(store: string): Promise<T> {
        return new Promise(async (resolve, reject) => {
            let sql = `SELECT * FROM ${store}`;

            try {
                let data;
                const { values } = await this._db.query({ statement:sql, values:[] });
                resolve(values);
            } catch(e) {
                reject(e);
            }
        });
    }

    remove(store, key): Promise<any> {
        return new Promise((resolve, reject) => {
            throw 'remove not impleted in db-sql yet';
        });
    }

    removeAll(store) {
        return new Promise((resolve, reject) => {
            throw 'removeAll not impleted in db-sql yet';
        });
    }

    count(store, opts?: { key }): Promise<number> {
        return new Promise(async (resolve, reject) => {
            let sql = `SELECT count(*) AS total FROM ${store} `;

            const { values } = await this._db.query({ statement:sql, values:[] });
            resolve(values);
        });
    }

    delete() {
        return this._deleteDatabase();
    }

    private _prepareTables() {
        return new Promise(async (resolve, reject) => {
            const schemas = this.schemaSvc.schema.stores;
            
            const promises = [];
            for(let schema of schemas) {
                let sql = `BEGIN TRANSACTION;`;
                
                sql += `CREATE TABLE IF NOT EXISTS ${schema.name} `;
                sql += `(`;

                for(let col of schema.columns) {
                    //TODO: for user table, need to fix primary key
                    // const ikPkTypeNumber = col['type'] == 'INTEGER';
                    sql += `${col.name}${col.type ? ' ' + col.type : ''}${col['isPrimaryKey'] ? ' PRIMARY KEY' : ''},`;
                }

                //remove extra ',' at the end
                sql = sql.substr(0, sql.length - 1);
                sql += `)`;

                sql += `COMMIT TRANSACTION;`;

                if(AppConstant.DEBUG) {
                    console.log('DbService: _prepareTables: sql:', sql);
                }
                
                const promise = this._db.execute({ statements: sql });
                promises.push(promise); 
            }

            try {
                await Promise.all(promises);
                resolve();
            } catch (e) {
                reject(e);
            }
        })
    }

    private _deleteDatabase(): Promise<{ result:boolean,message:string }> {
        return this._db.deleteDatabase({ database: this._dbName});
    }

    private _dbSuccess() {
        this._isDbInitialized = true;
    }

    private _dbError(err) {
        alert('Open database ERROR: ' + JSON.stringify(err));
    }
} 