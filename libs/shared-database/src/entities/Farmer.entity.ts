import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { Product } from './Product.entity';
import { Request } from './Request.entity';

@Entity('farmers')
export class Farmer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Index('idx_farmer_region')
  @Column()
  region: string;

  @OneToMany(() => Product, product => product.farmer)
  products: Product[];

  @OneToMany(() => Request, request => request.farmer)
  requests: Request[];

  @CreateDateColumn()
  created_at: Date;
}
