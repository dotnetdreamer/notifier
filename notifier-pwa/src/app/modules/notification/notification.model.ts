export interface INotification {
    id?: number;
    title: string;
    text: string;
    package: string;
    receivedOnUtc: string;
    image?: string;
    appName?: string;
    canLaunchApp?: boolean;

    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}

export interface INotificationIgnored {
    id?: number;
    text: string;
    package: string;
    silent: boolean;
    rule?: 'exact' | 'startsWith' | 'contains';
    image?: string;
    appName?: string;
    
    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}