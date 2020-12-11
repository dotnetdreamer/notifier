import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { Device } = Plugins;

import { AppConstant } from './app-constant';
import { DbService } from './db/db-base.service';
import { SchemaService } from './db/schema.service';
import { AppSettingService } from './app-setting.service';
import { AppInjector } from './app-injector';
import { HelperService } from './helper.service';
import { LocalizationService } from './localization.service';
import { DbWebService } from './db/db-web.service'; 
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { UserSettingService } from '../authentication/user-setting.service';
import { UserConstant } from '../authentication/user-constant';

@Injectable({
    providedIn: 'root'
})
export class BaseService {
    protected http: HttpClient;
    protected platform: Platform;
    protected dbService: DbService;
    protected schemaSvc: SchemaService;
    protected appSettingSvc: AppSettingService;
    protected userSettingSvc: UserSettingService;
    protected helperSvc: HelperService;
    protected localizationSvc: LocalizationService;
    protected pubsubSvc: NgxPubSubService;

    //hold anything that is currently in progress to avoid pushing same record more than once
    protected static pushQueue = [];

    constructor() {
        const injector = AppInjector.getInjector();

        this.http = injector.get(HttpClient);
        this.platform = injector.get(Platform);
        this.schemaSvc = injector.get(SchemaService);
        this.appSettingSvc = injector.get(AppSettingService);
        this.userSettingSvc = injector.get(UserSettingService);
        this.helperSvc = injector.get(HelperService);
        this.localizationSvc = injector.get(LocalizationService);
        this.pubsubSvc = injector.get(NgxPubSubService);

        setTimeout(async () => {
            const info = await Device.getInfo();
            // if(info.platform === "ios" || info.platform === "android") {
            //     this.dbService = injector.get(DbSqlService);
            // } else {
                this.dbService = injector.get(DbWebService);
            // }
        }, 0);
    }

    get tables() {
        return this.schemaSvc.tables;
    }

    protected getData<T>(args: HttpParams): Promise<T> {
        return new Promise(async (resolve, reject) => {
            let headers: HttpHeaders = await this.prepareHeaders(args);

            args.body = args.body || {};  
            if(!args.overrideUrl) {
                let newUrl = `${AppConstant.BASE_API_URL + args.url}`;

                for(let prop in args.body) {
                    if(args.body.hasOwnProperty(prop)) {
                        if(newUrl.includes('?')) {
                            newUrl += '&';
                        } else {
                            newUrl += '?';
                        }
                        newUrl += `${prop}=${typeof args.body[prop] === 'undefined' ? '' :  args.body[prop]}`;
                    }
                }   
                args.url = newUrl;
            }
            
            this.http.get<T>(args.url, {
                headers: headers
            })
            .subscribe(result => {
                resolve(<T>result);
            }, error => {
                this.handleError(error, args);
                if(args.errorCallback) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }

    protected postData<T>(args: HttpParams): Promise<T> {
        return new Promise(async (resolve, reject) => {
            let headers: HttpHeaders = await this.prepareHeaders(args);

            let newUrl;
            if(!args.overrideUrl) {
                newUrl = `${AppConstant.BASE_API_URL + args.url}`;
            } else {
                newUrl = args.url;
            }
  
            args.url = newUrl;

            //add to queue
            let body = args.body;
            if(Array.isArray(body)) {
                (<any[]>body).forEach(i => {
                    if(i.queuePattern) {
                        this._addToQueue(i.queuePattern);
                    }
                });
            } else if(body.queuePattern) {
                this._addToQueue(body.queuePattern);
            }

            this.http.post<T>(args.url, body, {
                headers: headers
            })
            .subscribe(result => {
                resolve(<T>result);
            }, error => {
                this.handleError(error, args);
                if(args.errorCallback) {
                    resolve();
                } else {
                    reject(error);
                }
            }).add(() => {
                //Called when operation is complete (both success and error)
                //remove from queue
                if(Array.isArray(body)) {
                    (<any[]>body).forEach(i => {
                        if(i.queuePattern) {
                            this._removeFromQueue(i.queuePattern);
                        }
                    });
                } else if(body.queuePattern) {
                    this._removeFromQueue(body.queuePattern);
                }
            });
        });
    }

    protected findInQueue(pattern) {
        return BaseService.pushQueue.findIndex(q => q == pattern);
    }

    private _addToQueue(pattern) {
        if(this.findInQueue(pattern) == -1) {
            BaseService.pushQueue.push(pattern);
        }
    }

    private _removeFromQueue(pattern) {
        const toRemove = this.findInQueue(pattern);
        if(toRemove == -1) {
            return;
        }
        BaseService.pushQueue.splice(toRemove);
    }

    protected async handleError(e: HttpErrorResponse, args: HttpParams) {
        if(AppConstant.DEBUG) {
            console.log('BaseService: handleError', e);
        }
        switch(e.status) {
            case 401:
                const u = await this.userSettingSvc.getCurrentUser();
                if(u) {
                    //kickout...
                    this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDOUT);
                }
            break;
            default:
                if(!args.errorCallback) {
                    let msg;
                    //the error might be thrown by e.g a plugin wasn't install properly. In that case text() will not be available
                    if(e.message) {
                        msg = e.message;            
                    } else {
                        msg = e.error.toString();
                    }
                    // setTimeout(async () => {
                    //     await this.helperSvc.alert(msg);
                    // });
                } else {
                    args.errorCallback(e, args);
                }
            break;
        }
    }
    
    private async prepareHeaders(args: HttpParams) {
        let headers = new HttpHeaders();
        if(!args.ignoreContentType) {
            headers = headers.append('Content-Type', 'application/json;charset=utf-8');            
        }
        const profile = await this.userSettingSvc.getUserProfileLocal();
        if(profile) {
            headers = headers.append('Authorization', `Bearer ${profile.access_token}`);            
        }

        if(args.httpHeaders) {
            args.httpHeaders.keys().forEach(k => {
                headers = headers.append(k, args.httpHeaders.get(k));
            });
        }
        return headers;
    }
}

export class HttpParams {
    url: string
    body?: any
    errorCallback?
    ignoreContentType?: boolean
    overrideUrl?: boolean
    httpHeaders?: HttpHeaders
}