import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';

@Entity()
export class AppInfo extends BaseComplexEntity {
  @Column()
  package: string;

  @Column()
  image: string;

  @Column()
  appName: string;
}
