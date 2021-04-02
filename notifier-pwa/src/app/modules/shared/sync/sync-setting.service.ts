import { Injectable } from "@angular/core";
import { AppSettingService } from "../app-setting.service";

@Injectable({
    providedIn: 'root'
})
export class SyncSettingService extends AppSettingService {
    constructor() {
        super();
    }
}