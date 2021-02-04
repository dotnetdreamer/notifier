import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";
import { AppConstant } from "../shared/app-constant";
import { AllSettings } from "./all-settings.entity";
import { IAllSettings } from "./all-settings.model";
import { AllSettingsService } from "./all-settings.service";


@Controller(`${AppConstant.ROUTE_PREFIX}/all-settings`)
export class AllSettingsController {
  constructor(private readonly allSettingSvc: AllSettingsService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { sync?: boolean }) {
    const data = await this.allSettingSvc.findAll({
      ...filters
    });

    return data;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: IAllSettings[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models)
    {
      const itemMap: Map<number, IAllSettings> = new Map();
      let returnedItem: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        delete toAdd.id;

        const item = await this.allSettingSvc.save(toAdd);
        returnedItem = item;        
      } else if(model.markedForUpdate) {
        const toUpdate = await this.allSettingSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedItem = updated;
      } else if(model.markedForDelete) {
        const toDelete = await this.allSettingSvc.findOne(model.id);
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

  private async _updateOrDelete(toUpdateOrDelete: AllSettings
    , model, shouldDelete?: boolean) {
    //no need to update
    // delete model.createdOn;
    // delete model.attachment;
    model.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.allSettingSvc.save(updated);

    return updated;
  }
}