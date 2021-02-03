export class NotificationConstant {
    public static readonly MAX_ITEMS_LIMIT = 1000;

    public static readonly KEY_IGNORE_SYSTEM_APPS_NOTIFICATIONS = "ignoreSystemApps";
    public static readonly KEY_IGNORE_EMPTY_MESSAGES = "ignoreEmptyMessages";

    public static readonly EVENT_NOTIFICATION_CREATED_OR_UPDATED = "event:notificationCreatedOrUpdated"; 
    public static readonly EVENT_NOTIFICATION_IGNORED_CREATED_OR_UPDATED = "event:notificationIgnoredCreatedOrUpdated"; 
}