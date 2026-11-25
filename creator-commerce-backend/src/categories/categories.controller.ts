import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
