export interface INotification {
    id?: number;
    title: string;
    text: string;
    package: string;
    receivedOnUtc: string;

    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}

export class NotificationRecordCreatedEvent {
    payload;
    
    constructor(payload) {
        this.payload = payload;
    }
}