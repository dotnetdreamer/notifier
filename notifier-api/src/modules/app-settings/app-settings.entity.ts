import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseEntity } from '../shared/entity/base.entity';

@Entity()
export class AppSettings extends BaseEntity {
  @Column()
  fieldName: string;

  @Column()
  fieldValue: string;
}
