export enum SyncEntity {
    NOTIFICATION = "notification",
    NOTIFICATION_IGNORED = "notificationIgnored",
    APP_INFO = "appInfo",
}

export interface ISyncItem {
    tableName: string;
    updatedOn: string;
}