import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private _setting = "setting";
    private _message = "message";
    private _user = "user";

    schema = {
        stores: [
            {
                name: this._message,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, { 
                    name: 'name', 
                    type: 'TEXT' 
                }, { 
                    name: 'groupName', 
                    type: 'TEXT' 
                }, { 
                    name: 'icon', 
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
        message: this._message,
        user: this._user
    };

    constructor() {

    }
}

export interface ITableOptions {
    name: string
    columns: Array<{ name, isPrimaryKey?, type? }>,
    autoIncrement?: boolean
}