export interface INotificationIgnored {
    id?: number;
    text: string;
  
    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}