import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SyncItem {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  tableName: string;

  @Column()
  updatedOn?: Date
}
