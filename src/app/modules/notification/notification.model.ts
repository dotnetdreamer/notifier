export interface INotification {
    id?: number;
    title: string;
    text: string;
    package: string;
    receivedOn: string;
    image?: string;
    appName?: string;

    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}