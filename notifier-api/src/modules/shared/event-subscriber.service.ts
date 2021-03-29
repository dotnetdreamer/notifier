import { OnEvent } from "@nestjs/event-emitter";

import * as moment from 'moment';

import { NotificationRecord } from "../notification/notification.entity";
import { NotificationRecordCreatedEvent } from "../notification/notification.model";
import { SyncItem } from "../sync/sync-item.entity";
import { SyncItemService } from "../sync/sync-item.service";
import { AppConstant } from "./app-constant";


export class EventSubScriberService {
    constructor(private readonly syncItemSvc: SyncItemService) {

    }

    @OnEvent(`${NotificationRecord.name}.created`, { async: true })
    async handleNotificationRecordEvent(data: NotificationRecordCreatedEvent) {
        // handle and process "OrderCreatedEvent" event
        console.log('handleOrderCreatedEvent');
        let table = await this.syncItemSvc.findOneByTableName(NotificationRecord.name);
        if(!table) {
            table = new SyncItem();
            table = Object.assign(table, {
                tableName: NotificationRecord.name,
                updatedOn: <any>moment.utc().format(AppConstant.DEFAULT_DATETIME_FORMAT)
            });
        } else {
            table.updatedOn = <any>moment.utc().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }
        
        await this.syncItemSvc.save(table);
    }
}