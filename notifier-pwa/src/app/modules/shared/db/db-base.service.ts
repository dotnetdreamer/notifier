export class DbService {
    get Db(): any { return; }
    putLocal(store, data): Promise<{ rowsAffected, insertId }>{ return; }
    
    get<T>(store: string, key: any): Promise<T> { return; }

    getAll<T>(store: string): Promise<T> { return; }

    getByFieldName<T>(store: string, fieldName: string, value: string): Promise<Array<T> | T> { return; }

    remove(store, id): Promise<any>{ return; }

    removeAll(store): Promise<any>{ return; }

    count(store, opts?: { key, value? }): Promise<number> { return; }

    delete(): Promise<any> { return; }
}