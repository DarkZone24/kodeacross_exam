import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Request } from './Request.entity';

@Entity('distributors')
export class Distributor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @OneToMany(() => Request, request => request.distributor)
  requests: Request[];

  @CreateDateColumn()
  created_at: Date;
}
