import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Farmer } from './Farmer.entity';
import { Product } from './Product.entity';
import { Distributor } from './Distributor.entity';

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  FULFILLED = 'FULFILLED',
}

@Entity('requests')
@Index('idx_request_distributor', ['distributor_id', 'status'])
@Index('idx_request_farmer', ['farmer_id', 'status'])
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Distributor, distributor => distributor.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'distributor_id' })
  distributor: Distributor;

  @Column()
  distributor_id: string;

  @ManyToOne(() => Farmer, farmer => farmer.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @Column()
  farmer_id: string;

  @ManyToOne(() => Product, product => product.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @Column('int')
  quantity: number;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
