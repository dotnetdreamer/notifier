import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';

import { SyncItem } from './sync-item.entity';

@Injectable()
export class SyncItemService {
  constructor(
    @InjectRepository(SyncItem) private syncItemRepo: Repository<SyncItem>
  ) {}

  async findAll(args?: { tableName?, updatedOn? })
    : Promise<{ total, data: SyncItem[]}> {
    let qb = await getRepository(SyncItem)
      .createQueryBuilder('sync'); 

    if(!args) {
      args = <any>{};
    }

    if(args.tableName) {
      qb = qb.andWhere("sync.tableName == :tableName", { tableName: args.tableName });
    }

    if(args.updatedOn) {
      qb = qb.andWhere("sync.updatedOn >= :dateFrom", { dateFrom: args.updatedOn });
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

    // if(newRrd.updatedOn) {
    //   newRrd.updatedOn = .tz(AppConstant.DEFAULT_TIME_ZONE, false);
    // }
    const saved = await this.syncItemRepo.save(newRrd);
    return saved;
  }

  remove(id) {
    return this.syncItemRepo.delete(id);
  }
}