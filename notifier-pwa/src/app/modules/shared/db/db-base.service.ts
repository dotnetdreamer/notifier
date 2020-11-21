export class DbService {
    get Db(): any { return; }
    putLocal(store, data): Promise<{ rowsAffected, insertId }>{ return; }
    
    get<T>(store: string, key: any): Promise<T> { return; }
    getAll<T>(store: string): Promise<T> { return; }

    remove(store, id): Promise<any>{ return; }

    removeAll(store): Promise<any>{ return; }

    count(store, opts?: { key }): Promise<number> { return; }

    delete(): Promise<any> { return; }
}