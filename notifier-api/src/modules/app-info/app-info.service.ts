import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { HelperService } from '../shared/helper.service';
import { AppInfo } from './app-info.entity';
import { IAppInfo } from './app-info.model';

@Injectable()
export class AppInfoService {
  constructor(
    @InjectRepository(AppInfo) private appInfoRepo: Repository<AppInfo>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { sync?: boolean }): Promise<{ data: IAppInfo[], total: number }> {
    let qb = await getRepository(AppInfo)
      .createQueryBuilder('app'); 
      
    qb = qb.orderBy("app.createdOn", 'DESC')
      .addOrderBy('app.id', 'DESC');

    const [ data, total ] = await qb.getManyAndCount();

    const records = await Promise.all(data.map(async (e) => {
      const map = await this._map(e);
      return map;
    }));

    return {
      data: records,
      total: total
    };
  }

  findOne(id): Promise<AppInfo> {
    return this.appInfoRepo.findOne(id);
  }

  async findOneByPackage(pkg): Promise<IAppInfo> {
    const item = await this.appInfoRepo.findOne({ where: { package: pkg } });
    if(!item) {
      return null;
    }
    
    const maped = await this._map(item);
    return maped;
  }

  async save(appInfo: IAppInfo) {
    let newOrUpdated: any = Object.assign({}, appInfo);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    //now save
    let newRrd = new AppInfo();
    newRrd = Object.assign({}, newOrUpdated);

    const saved = await this.appInfoRepo.save(newRrd);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.appInfoRepo.delete(id);
  }

  private async _map(not: AppInfo) {
    let mNewRrd: IAppInfo;
    mNewRrd = <any>Object.assign({}, not);

    //remove 
    delete mNewRrd['markedForAdd'];
    delete mNewRrd['markedForUpdate'];
    delete mNewRrd['markedForDelete'];
    
    return mNewRrd;
  }
}