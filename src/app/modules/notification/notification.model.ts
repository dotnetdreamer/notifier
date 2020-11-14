export interface INotification {
    id?: number;
    title: string;
    text: string;
    package: string;
    receivedOn: string;

    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}