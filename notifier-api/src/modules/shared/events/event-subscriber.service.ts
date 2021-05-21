import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';

import * as moment from 'moment';
import * as mtz from 'moment-timezone';

import { NotificationRecord } from "../../notification/notification.entity";
import { NotificationRecordCreatedEvent } from "../../notification/notification.model";
import { SyncItem } from "../../sync/sync-item.entity";
import { AppConstant } from "../app-constant";


export class EventSubScriberService {
    constructor(@InjectRepository(SyncItem) private syncItemRepo: Repository<SyncItem>) {

    }

    @OnEvent(`${NotificationRecord.name}.created`, { async: true })
    async handleNotificationRecordEvent(data: NotificationRecordCreatedEvent) {
        const updatedOn = <any>mtz(moment.utc(), AppConstant.DEFAULT_TIME_ZONE, false)
            .toISOString();
        let table = await this.syncItemRepo.findOne({ where: { tableName: NotificationRecord.name }});
        if(!table) {
            table = new SyncItem();
            table = Object.assign(table, {
                tableName: NotificationRecord.name,
                updatedOn: updatedOn
            });
        } else {
            table.updatedOn = updatedOn;
        }
        
        await this.syncItemRepo.save(table);
    }
}