import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';

import { HelperService } from '../shared/helper.service';
import { SyncItem } from './sync-item.entity';

@Injectable()
export class SyncItemService {
  constructor(
    @InjectRepository(SyncItem) private syncItemRepo: Repository<SyncItem>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { 
    dateFrom?: string
  }): Promise<{ total, data: SyncItem[]}> {
    let qb = await getRepository(SyncItem)
      .createQueryBuilder('sync'); 

    if(args.dateFrom) {
      qb = qb.andWhere("sync.updatedOn >= :dateFrom", { dateFrom: args.dateFrom });
    }

    qb = qb.orderBy("sync.id", 'DESC');

    const [ data, total ] = await qb.getManyAndCount();
    
    return { total: total, data: data };
  }

  findOne(id): Promise<SyncItem> {
    return this.syncItemRepo.findOne(id);
  }

  findOneByTableName(tableName): Promise<SyncItem> {
    return this.syncItemRepo.findOne({ where: { tableName: tableName }});
  }

  async save(syncItem: SyncItem) {
    let newRrd = new SyncItem();
    newRrd = Object.assign({}, syncItem);

    const saved = await this.syncItemRepo.save(newRrd);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.syncItemRepo.delete(id);
  }
}