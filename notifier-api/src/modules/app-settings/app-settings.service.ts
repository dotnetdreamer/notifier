import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';

import { HelperService } from '../shared/helper.service';
import { AppSettings } from './app-settings.entity';
import { IAppSettings } from './app-settings.model';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSettings) private appSettingsRepo: Repository<AppSettings>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { 
    sync?: boolean
  }): Promise<any[]> {
    let qb = await getRepository(AppSettings)
      .createQueryBuilder('appSet'); 

    qb = qb.orderBy("appSet.id", 'DESC');

    const appSettings = await qb.getMany();
    
    const data = appSettings.map(async (e) => {
      const map = await this._map(e);
      return map;
    });
    return Promise.all(data);
  }

  findOne(id): Promise<AppSettings> {
    return this.appSettingsRepo.findOne(id);
  }

  findOneByFieldName(fieldName): Promise<AppSettings> {
    return this.appSettingsRepo.findOne({ where: { fieldName: fieldName }});
  }

  async save(appSettings: IAppSettings) {
    let newOrUpdated: any = Object.assign({}, appSettings);

    //now save
    let newRrd = new AppSettings();
    newRrd = Object.assign({}, newOrUpdated);

    const saved = await this.appSettingsRepo.save(newRrd);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.appSettingsRepo.delete(id);
  }

  private async _map(not: AppSettings) {
    let mNotRrd: IAppSettings;
    mNotRrd = <any>Object.assign({}, not);

    //remove 
    delete mNotRrd['markedForAdd'];
    delete mNotRrd['markedForUpdate'];
    delete mNotRrd['markedForDelete'];
    
    return mNotRrd;
  }
}