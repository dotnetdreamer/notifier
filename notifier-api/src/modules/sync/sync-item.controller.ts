import { ClassSerializerInterceptor, Controller, Get, Query, Req, UseInterceptors } from "@nestjs/common";

import { AppConstant } from "../shared/app-constant";
import { SyncItemService } from "./sync-item.service";

@Controller(`${AppConstant.ROUTE_PREFIX}/sync`)
export class AllSettingsController {
    constructor(private syncItemSvc: SyncItemService) {

    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get('getAll')
    async check(@Req() req: Request, @Query() filters: { date: string }) {
        return this.syncItemSvc.findAll({ dateFrom: filters.date });
    }
}