import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";
import { AppConstant } from "../shared/app-constant";
import { AppSettings } from "./app-settings.entity";
import { IAppSettings } from "./app-settings.model";
import { AppSettingsService } from "./app-settings.service";


@Controller(`${AppConstant.ROUTE_PREFIX}/app-settings`)
export class AppSettingsController {
  constructor(private readonly appSettingSvc: AppSettingsService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { sync?: boolean }) {
    const data = await this.appSettingSvc.findAll({
      ...filters
    });

    return data;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: IAppSettings[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models)
    {
      const itemMap: Map<number, IAppSettings> = new Map();
      let returnedItem: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        delete toAdd.id;

        const item = await this.appSettingSvc.save(toAdd);
        returnedItem = item;        
      } else if(model.markedForUpdate) {
        const toUpdate = await this.appSettingSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedItem = updated;
      } else if(model.markedForDelete) {
        const toDelete = await this.appSettingSvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }

        let deleted = await this._updateOrDelete(toDelete, model, true);
        returnedItem = deleted;
      }

      itemMap.set(model.id, returnedItem);
      items.push(itemMap);
    }

    //test delay...
    // await this._timeout();
    return items;
  }

  private async _updateOrDelete(toUpdateOrDelete: AppSettings
    , model, shouldDelete?: boolean) {
    //no need to update
    // delete model.createdOn;
    // delete model.attachment;
    model.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.appSettingSvc.save(updated);

    return updated;
  }
}