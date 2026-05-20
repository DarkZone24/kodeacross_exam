import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Farmer } from './Farmer.entity';
import { Request } from './Request.entity';

@Entity('products')
@Index('idx_product_category_price', ['category', 'price'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  stock: number;

  @Column()
  category: string;

  @Column()
  image_key: string;

  @ManyToOne(() => Farmer, farmer => farmer.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmer_id' })
  farmer: Farmer;

  @Column()
  farmer_id: string;

  @OneToMany(() => Request, request => request.product)
  requests: Request[];

  @CreateDateColumn()
  created_at: Date;
}
