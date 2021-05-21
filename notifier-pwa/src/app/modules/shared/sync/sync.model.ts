export enum SyncEntity {
    NOTIFICATION_RECORD = "NotificationRecord",
    NOTIFICATION_IGNORED_ITEM = "NotificationIgnoredItem",
    APP_INFO = "AppInfo",
}

export interface ISyncItem {
    tableName: string;
    updatedOn: string;
}