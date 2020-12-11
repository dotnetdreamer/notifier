import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";

import { NotificationIgnoredItem } from "./notification-ignored.entity";
import { INotificationIgnored } from "./notification-ignored.model";
import { NotificationIgnoredService } from "./notification-ignored.service";

@Controller('notification-ignored')
export class NotificationIgnoredController {
  constructor(private readonly notificationIgnoredSvc: NotificationIgnoredService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { sync?: boolean }) {
    const data = await this.notificationIgnoredSvc.findAll({
      ...filters
    });

    return data;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: INotificationIgnored[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models)
    {
      const itemMap: Map<number, INotificationIgnored> = new Map();
      let returnedExpense: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        delete toAdd.id;

        const item = await this.notificationIgnoredSvc.save(toAdd);
        returnedExpense = item;        
      } else if(model.markedForUpdate) {
        const toUpdate = await this.notificationIgnoredSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedExpense = updated;
      } else if(model.markedForDelete) {
        const toDelete = await this.notificationIgnoredSvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }

        let deleted = await this._updateOrDelete(toDelete, model, true);
        returnedExpense = deleted;
      }

      itemMap.set(model.id, returnedExpense);
      items.push(itemMap);
    }

    //test delay...
    // await this._timeout();
    return items;
  }

  private async _updateOrDelete(toUpdateOrDelete: NotificationIgnoredItem
    , model, shouldDelete?: boolean) {
    //no need to update
    // delete model.createdOn;
    // delete model.attachment;
    model.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.notificationIgnoredSvc.save(updated);

    return updated;
  }

  private async _prepare(not: NotificationIgnoredItem) {
    let mExp = Object.assign({}, not);
    
    //remove 
    delete mExp['markedForAdd'];
    delete mExp['markedForUpdate'];
    delete mExp['markedForDelete'];

    return mExp;
  }
}