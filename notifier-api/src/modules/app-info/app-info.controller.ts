import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";

import { AppConstant } from "../shared/app-constant";
import { AppInfo } from "./app-info.entity";
import { IAppInfo } from "./app-info.model";
import { AppInfoService } from "./app-info.service";

@Controller(`${AppConstant.ROUTE_PREFIX}/app-info`)
export class AppInfoController {
  constructor(private readonly appInfoSvc: AppInfoService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { sync?: boolean }) {
    const data = await this.appInfoSvc.findAll({
      ...filters
    });

    return data;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: IAppInfo[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models) {
      const itemMap: Map<number, IAppInfo> = new Map();
      let returnedItem: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        delete toAdd.id;

        //check for duplicate
        const existingRcrd = await this.appInfoSvc.findOneByPackage(toAdd.package);
        if(existingRcrd) {
          returnedItem = existingRcrd; 
        } else {
          const item = await this.appInfoSvc.save(toAdd);
          returnedItem = item; 
        }
      } else if(model.markedForUpdate) {
        const toUpdate = await this.appInfoSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model);
        returnedItem = updated;
      } else if(model.markedForDelete) {
        const toDelete = await this.appInfoSvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }

        const deleteResult = await this.appInfoSvc.remove(toDelete.id);
        returnedItem = toDelete;
      }

      itemMap.set(model.id, returnedItem);
      items.push(itemMap);
    }

    //test delay...
    // await this._timeout();
    return items;
  }

  private async _updateOrDelete(toUpdateOrDelete: AppInfo, model) {
    //no need to update
    // delete model.createdOn;
    // delete model.attachment;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.appInfoSvc.save(updated);

    return updated;
  }
}