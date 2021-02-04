import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';

import { HelperService } from '../shared/helper.service';
import { AllSettings } from './all-settings.entity';
import { IAllSettings } from './all-settings.model';

@Injectable()
export class AllSettingsService {
  constructor(
    @InjectRepository(AllSettings) private allSettingsRepo: Repository<AllSettings>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { 
    sync?: boolean
  }): Promise<any[]> {
    let qb = await getRepository(AllSettings)
      .createQueryBuilder('appSet'); 

    qb = qb.orderBy("appSet.id", 'DESC');

    const allSettings = await qb.getMany();
    
    const data = allSettings.map(async (e) => {
      const map = await this._map(e);
      return map;
    });
    return Promise.all(data);
  }

  findOne(id): Promise<AllSettings> {
    return this.allSettingsRepo.findOne(id);
  }

  findOneByFieldName(fieldName): Promise<AllSettings> {
    return this.allSettingsRepo.findOne({ where: { fieldName: fieldName }});
  }

  async save(allSettings: IAllSettings) {
    let newOrUpdated: any = Object.assign({}, allSettings);

    //now save
    let newRrd = new AllSettings();
    newRrd = Object.assign({}, newOrUpdated);

    const saved = await this.allSettingsRepo.save(newRrd);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.allSettingsRepo.delete(id);
  }

  private async _map(not: AllSettings) {
    let mNotRrd: IAllSettings;
    mNotRrd = <any>Object.assign({}, not);

    //remove 
    delete mNotRrd['markedForAdd'];
    delete mNotRrd['markedForUpdate'];
    delete mNotRrd['markedForDelete'];
    
    return mNotRrd;
  }
}