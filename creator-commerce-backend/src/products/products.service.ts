import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, paginationArgs } from '../common/pagination';
import { CreateProductDto, ProductSearchDto, UpdateProductDto } from './products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductDto) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) throw new NotFoundException('Create your brand profile first');
    return this.prisma.product.create({ data: { ...dto, brandId: brand.id } });
  }

  async myProducts(userId: string, q: ProductSearchDto) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) throw new NotFoundException('Create your brand profile first');
    const { page, pageSize, skip, take } = paginationArgs(q);
    const where: Prisma.ProductWhereInput = { brandId: brand.id, marketplace: q.marketplace, categoryId: q.categoryId };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { category: true, brand: true } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    await this.assertOwnership(userId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  private async assertOwnership(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { brand: true } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.brand.userId !== userId) throw new ForbiddenException('You do not own this product');
    return product;
  }
}
