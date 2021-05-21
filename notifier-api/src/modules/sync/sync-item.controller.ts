import { Body, ClassSerializerInterceptor, Controller, Get, Post, Query, Req, UseInterceptors } from "@nestjs/common";

import { Request } from "express";
import * as moment from 'moment';
import * as mtz from 'moment-timezone';

import { AppConstant } from "../shared/app-constant";
import { SyncItem } from "./sync-item.entity";
import { SyncItemService } from "./sync-item.service";

@Controller(`${AppConstant.ROUTE_PREFIX}/sync`)
export class SyncItemController {
    constructor(private syncItemSvc: SyncItemService) {

    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('getAll')
    async getAll(@Req() req: Request, @Body() filters: Array<{ tableName, updatedOn }>) {
        const promises = <Array<Promise<{total: any, data: SyncItem[] }>>>[];
        for(let f of filters) {
            //change to proper timezone
            // const before = f.updatedOn;
            // f.updatedOn = moment.utc(f.updatedOn).tz(AppConstant.DEFAULT_TIME_ZONE, false)
            //     .format(AppConstant.DEFAULT_DATETIME_FORMAT);
            // console.log(`${f.tableName}: ${before}`, f.updatedOn)
            promises.push(this.syncItemSvc.findAll(f));
        }

        const res = await Promise.all(promises);
        const syncItems = res.map(r => r.data[0])
            .filter(r => r != null);
        
        return {
            total: syncItems.length,
            data: syncItems
        };
    }
}