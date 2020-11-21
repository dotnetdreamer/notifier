import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

import { BaseComplexEntity } from './base-complex.entity';

@Entity()
export class BaseUserEntity extends BaseComplexEntity {
    @Column({ nullable: true })
    createdBy?: number

    @Column({ nullable: true })
    updatedBy?: number
}