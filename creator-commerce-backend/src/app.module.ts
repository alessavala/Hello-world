import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ActivityLogModule } from './common/activity-log.module';
import { ReputationModule } from './common/reputation.module';
import { MailModule } from './common/mail.module';
import { AuthModule } from './auth/auth.module';
import { CreatorsModule } from './creators/creators.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ApplicationsModule } from './applications/applications.module';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { DeliverablesModule } from './deliverables/deliverables.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DisputesModule } from './disputes/disputes.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    ActivityLogModule,
    ReputationModule,
    MailModule,
    AuthModule,
    CreatorsModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    CampaignsModule,
    ApplicationsModule,
    CollaborationsModule,
    DeliverablesModule,
    ReviewsModule,
    DisputesModule,
    ChatModule,
    AdminModule,
    FavoritesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
