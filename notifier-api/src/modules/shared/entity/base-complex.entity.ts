import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity()
export class BaseComplexEntity extends BaseEntity {
    @Column()
    isDeleted: boolean
}