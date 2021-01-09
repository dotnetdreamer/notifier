export interface INotificationIgnored {
    id?: number;
    text: string;
    package: string;
    silent: boolean;
    rule?: 'exact' | 'startsWith' | 'contains';
  
    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}