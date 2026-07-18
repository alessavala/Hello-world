import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductSearchDto, UpdateProductDto } from './products.dto';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Roles(UserRole.BRAND)
  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateProductDto) {
    return this.service.create(u.sub, dto);
  }

  @Roles(UserRole.BRAND)
  @Get('me')
  mine(@CurrentUser() u: AuthUser, @Query() q: ProductSearchDto) {
    return this.service.myProducts(u.sub, q);
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.BRAND)
  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(u.sub, id, dto);
  }
}
