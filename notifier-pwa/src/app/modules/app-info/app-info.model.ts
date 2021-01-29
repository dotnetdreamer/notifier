export interface IAppInfo {
    id?: number;
    package: string;
    image: string;
    appName: string;

    updatedOn?: string;
    createdOn?: string;

    markedForAdd?: boolean;
    markedForUpdate?: boolean;
    markedForDelete?: boolean;
}