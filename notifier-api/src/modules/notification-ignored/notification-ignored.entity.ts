import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseEntity } from '../shared/entity/base.entity';

@Entity()
export class NotificationIgnoredItem extends BaseEntity {
  @Column()
  text: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  appName?: string;
}
