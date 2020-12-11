import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { NotificationIgnoredItem } from './notification-ignored.entity';
import { INotificationIgnored } from './notification-ignored.model';
import { HelperService } from '../shared/helper.service';

@Injectable()
export class NotificationIgnoredService {
  constructor(
    @InjectRepository(NotificationIgnoredItem) private notificationRecordRepo: Repository<NotificationIgnoredItem>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { sync?: boolean }): Promise<any[]> {
    let qb = await getRepository(NotificationIgnoredItem)
      .createQueryBuilder('not'); 
      
    qb = qb.orderBy("not.createdOn", 'DESC')
      .addOrderBy('not.id', 'DESC');

    const notificationRecords = await qb.getMany();

    const data = notificationRecords.map(async (e) => {
      const map = await this._map(e);
      return map;
    });
    return Promise.all(data);
  }

  findOne(id): Promise<NotificationIgnoredItem> {
    return this.notificationRecordRepo.findOne(id);
  }

  async findOneByText(text): Promise<INotificationIgnored> {
    const item = await this.notificationRecordRepo.findOne({ where: { text: text } });
    if(!item) {
      return null;
    }
    
    const maped = await this._map(item);
    return maped;
  }

  async save(notificationRecord: INotificationIgnored) {
    let newOrUpdated: any = Object.assign({}, notificationRecord);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    //now save
    let newNotRrd = new NotificationIgnoredItem();
    newNotRrd = Object.assign({}, newOrUpdated);

    const saved = await this.notificationRecordRepo.save(newNotRrd);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.notificationRecordRepo.delete(id);
  }

  private async _map(not: NotificationIgnoredItem) {
    let mNotRrd: INotificationIgnored;
    mNotRrd = <any>Object.assign({}, not);

    //remove 
    delete mNotRrd['markedForAdd'];
    delete mNotRrd['markedForUpdate'];
    delete mNotRrd['markedForDelete'];
    
    return mNotRrd;
  }
}