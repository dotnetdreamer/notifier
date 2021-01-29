import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private _setting = "setting";
    private _notification = "notification";
    private _notificationIgnored = "notificationIgnored";
    private _user = "user";
    private _appInfo = "appInfo";

    schema = {
        stores: [
            {
                name: this._notification,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, { 
                    name: 'title', 
                    type: 'TEXT' 
                }, { 
                    name: 'text', 
                    type: 'TEXT' 
                }, { 
                    name: 'package', 
                    type: 'TEXT' 
                }, {
                    name: 'image', 
                    type: 'TEXT' 
                }, {
                    name: 'appName', 
                    type: 'TEXT'
                }, {
                    name: 'receivedOn', 
                    type: 'TEXT' 
                }, { 
                    name: 'updatedOn', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForAdd', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForUpdate', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForDelete', 
                    type: 'TEXT'  
                }],
                indexes: [{
                    name: 'package',
                    keyPath: 'package',
                }, {
                    name: 'text',
                    keyPath: 'text'
                }]
            }, {
                name: this._notificationIgnored,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, { 
                    name: 'text', 
                    type: 'TEXT'
                }, { 
                    name: 'package', 
                    type: 'TEXT' 
                }, { 
                    name: 'silent', 
                    type: 'TEXT' 
                }, {
                    name: 'image', 
                    type: 'TEXT' 
                }, {
                    name: 'appName', 
                    type: 'TEXT'
                }, { 
                    name: 'updatedOn', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForAdd', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForUpdate', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForDelete', 
                    type: 'TEXT'  
                }],
                indexes: [{
                    name: 'text',
                    keyPath: 'text'
                }]
            }, {
                name: this._appInfo,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                },{ 
                    name: 'package', 
                    type: 'TEXT' 
                }, {
                    name: 'image', 
                    type: 'TEXT' 
                }, {
                    name: 'appName', 
                    type: 'TEXT'
                }, { 
                    name: 'updatedOn', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForAdd', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForUpdate', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForDelete', 
                    type: 'TEXT'  
                }],
                indexes: [{
                    name: 'package',
                    keyPath: 'package'
                }]
            }, {
                name: this._setting,
                columns: [{ 
                    name: 'key', 
                    isPrimaryKey: true, 
                    type: 'TEXT' 
                }, {
                    name: 'value', 
                    type: 'TEXT'  
                }],              
            }
        ]
    };
    tables = {
        setting: this._setting,
        notification: this._notification,
        notificationIgnored: this._notificationIgnored,
        user: this._user,
        appInfo: this._appInfo
    };

    constructor() {

    }
}

export interface ITableOptions {
    name: string
    columns: Array<{ name, isPrimaryKey?, type? }>,
    autoIncrement?: boolean
}