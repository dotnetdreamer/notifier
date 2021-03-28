import { OnEvent } from "@nestjs/event-emitter";

import { NotificationRecord } from "../notification/notification.entity";
import { NotificationRecordCreatedEvent } from "../notification/notification.model";


export class EventSubScriberService {
    @OnEvent(`${NotificationRecord.name}.created`, { async: true })
    handleNotificationRecordEvent(payload: NotificationRecordCreatedEvent) {
        // handle and process "OrderCreatedEvent" event
        console.log('handleOrderCreatedEvent');
    }
}