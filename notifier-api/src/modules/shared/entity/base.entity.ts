import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  createdOn?: Date

  @Column({ nullable: true })
  updatedOn?: Date
}