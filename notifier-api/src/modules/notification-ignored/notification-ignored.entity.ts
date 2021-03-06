import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseEntity } from '../shared/entity/base.entity';

@Entity()
export class NotificationIgnoredItem extends BaseEntity {
  @Column()
  text: string;

  @Column()
  package: string;

  @Column()
  silent: boolean;

  @Column({ nullable: true })
  rule?: 'exact' | 'startsWith' | 'contains';
}
