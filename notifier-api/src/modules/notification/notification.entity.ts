import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

import { BaseComplexEntity } from '../shared/entity/base-complex.entity';

@Entity()
export class NotificationRecord extends BaseComplexEntity {
  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  text: string;

  @Column()
  package: string;

  @Column()
  receivedOnUtc: Date
}
