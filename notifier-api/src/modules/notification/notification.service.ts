import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { NotificationRecord } from './notification.entity';
import { INotification, NotificationRecordCreatedEvent } from './notification.model';
import { HelperService } from '../shared/helper.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationRecord) private notificationRecordRepo: Repository<NotificationRecord>
    , @Inject(REQUEST) private readonly request: Request
    , private eventEmitter: EventEmitter2
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { 
    pageIndex, pageSize
    , fromDate?: string, toDate?: string
    , showHidden?: boolean
  }): Promise<{ data: any[], total: number }> {
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

    const skip = (args.pageIndex - 1) * args.pageSize;
    qb = qb.skip(skip).take(args.pageSize);

    const [ data, total ] = await qb.getManyAndCount();

    const notificationRecords = await Promise.all(data.map(async (e) => {
      const map = await this._map(e);
      return map;
    }));

    return {
      data: notificationRecords,
      total: total
    };
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

    //notify
    this.eventEmitter.emit(`${NotificationRecord.name}.created`, 
      new NotificationRecordCreatedEvent(saved)
    );

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