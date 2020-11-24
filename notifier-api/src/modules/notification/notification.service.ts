import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { NotificationRecord } from './notification.entity';
import { INotification } from './notification.model';
import { HelperService } from '../shared/helper.service';
import { NotificationIgnoredItem } from './notification-ignored.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationRecord) private notificationRecordRepo: Repository<NotificationRecord>
    , @InjectRepository(NotificationIgnoredItem) private notificationIgnoredItemRepo: Repository<NotificationIgnoredItem>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { 
    fromDate?: string, toDate?: string
    , showHidden?: boolean, sync?: boolean
  }): Promise<any[]> {
    let qb = await getRepository(NotificationRecord)
      .createQueryBuilder('not'); 
      
    if(args && (args.fromDate || args.toDate)) {
      if(args.fromDate) {
        // const fromDate =  moment(args.fromDate, AppConstant.DEFAULT_DATE_FORMAT).toDate();
        const fromDate = args.fromDate;
        qb = qb.andWhere('not.receivedOnUtc >= :createdOnFrom', { createdOnFrom: fromDate });
      }
      if(args.toDate) {
        const toDate =  args.toDate; 
        qb = qb.andWhere('not.receivedOnUtc <= :createdOnToDate', { createdOnToDate: toDate });
      }
    }

    qb = qb.andWhere('not.isDeleted <= :isDeleted', { isDeleted: args && args.showHidden ? true : false });
    qb = qb.orderBy("not.receivedOnUtc", 'DESC')
      .addOrderBy('not.id', 'DESC');

    const notificationRecords = await qb.getMany();

    const data = notificationRecords.map(async (e) => {
      const map = await this._map(e);
      return map;
    });
    return Promise.all(data);
  }

  findOne(id): Promise<NotificationRecord> {
    return this.notificationRecordRepo.findOne(id);
  }

  async save(notificationRecord: INotification) {
    let newOrUpdated: any = Object.assign({}, notificationRecord);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    //now save
    let newNotRrd = new NotificationRecord();
    newNotRrd = Object.assign({}, newOrUpdated);

    const saved = await this.notificationRecordRepo.save(newNotRrd);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.notificationRecordRepo.delete(id);
  }

  private async _map(not: NotificationRecord) {
    let mNotRrd: INotification;
    mNotRrd = <any>Object.assign({}, not);

    //remove 
    delete mNotRrd['markedForAdd'];
    delete mNotRrd['markedForUpdate'];
    delete mNotRrd['markedForDelete'];
    
    return mNotRrd;
  }
}