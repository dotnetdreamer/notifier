import { Injectable } from "@angular/core";

import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

import { SyncEntity } from './sync.model';
import { SyncConstant } from './sync-constant';
import { AppConstant } from '../app-constant';


@Injectable({
    providedIn: 'root'
})
export class SyncHelperService {
    constructor(private pubsubSvc: NgxPubSubService) {
    }

    pull(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            const promises: Array<Promise<any>> = [];

            if(table) {
                switch(table) {
                    case SyncEntity.Category:
                        // promises.push(this.categorySvc.pull());
                    break;
                    case SyncEntity.Attachment:
                        // promises.push(this.attachmentSvc.pull());
                    break;
                    case SyncEntity.Group:
                        // promises.push(this.groupSvc.pull());
                    break;
                    case SyncEntity.Expense:
                        // promises.push(this.expenseSvc.pull());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //category
                // promises.push(this.categorySvc.pull());
                //group
                // promises.push(this.groupSvc.pull());
                //attachment
                // promises.push(this.attachmentSvc.pull());
                //expense
                // promises.push(this.expenseSvc.pull());
            }
            
            try {
                await Promise.all(promises);
                resolve();
            } catch(e) {
                reject(e);
            } finally {
                if(AppConstant.DEBUG) {
                    console.log('SyncHelperService: publishing EVENT_SYNC_DATA_PULL_COMPLETE');
                }
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE);
            }
        });
    }
    
    push(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            let promises: Array<Promise<any>> = [];
            if(table) {
                switch(table) {
                    case SyncEntity.Category:
                        // promises.push(this.categorySvc.push());
                    break;
                    case SyncEntity.Attachment:
                        // promises.push(this.attachmentSvc.push());
                    break;
                    case SyncEntity.Group:
                        // promises.push(this.groupSvc.push());
                    break;
                    case SyncEntity.Expense:
                        // promises.push(this.expenseSvc.push());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //category
                // promises.push(this.categorySvc.push());
                //attachment
                // promises.push(this.attachmentSvc.push());
                //group
                // promises.push(this.groupSvc.push());
                //expense
                // promises.push(this.expenseSvc.push());
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
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, promises.length);
            }
        });
    }

}