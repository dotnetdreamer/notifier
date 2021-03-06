export interface IAllSettings {
    id?: number;
    fieldValue: string;
    fieldName: string;

    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}