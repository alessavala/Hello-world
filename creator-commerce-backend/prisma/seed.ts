import { PrismaClient, UserRole, Marketplace, SocialPlatform, CompensationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

async function main() {
  const categoryNames = ['Suplementos', 'Belleza', 'Fitness', 'Hogar', 'Electrónica', 'Bebés', 'Moda', 'Mascotas', 'Alimentos', 'Juguetes'];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } }),
    ),
  );

  const adminHash = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@creatorcommerce.local' },
    update: {},
    create: { email: 'admin@creatorcommerce.local', passwordHash: adminHash, role: UserRole.ADMIN },
  });

  const demoPasswordHash = await bcrypt.hash('Demo123!', 12);

  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@creatorcommerce.local' },
    update: {},
    create: { email: 'creator@creatorcommerce.local', passwordHash: demoPasswordHash, role: UserRole.CREATOR },
  });
  const creatorProfile = await prisma.creatorProfile.upsert({
    where: { userId: creatorUser.id },
    update: {},
    create: {
      userId: creatorUser.id,
      displayName: 'Ana Creadora',
      bio: 'Creadora de contenido de belleza y fitness en TikTok e Instagram.',
      country: 'MX',
      city: 'Ciudad de México',
    },
  });
  await prisma.socialAccount.upsert({
    where: { creatorId_platform_username: { creatorId: creatorProfile.id, platform: SocialPlatform.TIKTOK, username: 'ana.creadora' } },
    update: {},
    create: { creatorId: creatorProfile.id, platform: SocialPlatform.TIKTOK, username: 'ana.creadora', profileUrl: 'https://tiktok.com/@ana.creadora', followers: 85000, averageViews: 42000, engagementRate: 0.07 },
  });
  await prisma.creatorMarketplace.upsert({
    where: { creatorId_marketplace: { creatorId: creatorProfile.id, marketplace: Marketplace.TIKTOK_SHOP } },
    update: {},
    create: { creatorId: creatorProfile.id, marketplace: Marketplace.TIKTOK_SHOP, profileUrl: 'https://shop.tiktok.com/@ana.creadora' },
  });
  await prisma.creatorCategory.upsert({
    where: { creatorId_categoryId: { creatorId: creatorProfile.id, categoryId: categories[1].id } },
    update: {},
    create: { creatorId: creatorProfile.id, categoryId: categories[1].id },
  });

  const brandUser = await prisma.user.upsert({
    where: { email: 'brand@creatorcommerce.local' },
    update: {},
    create: { email: 'brand@creatorcommerce.local', passwordHash: demoPasswordHash, role: UserRole.BRAND },
  });
  const brandProfile = await prisma.brandProfile.upsert({
    where: { userId: brandUser.id },
    update: {},
    create: { userId: brandUser.id, businessName: 'Glow Cosmetics', country: 'MX', description: 'Marca de cosméticos vendida en TikTok Shop y Mercado Libre.' },
  });
  const product = await prisma.product.upsert({
    where: { id: 'seed-product-glow-serum' },
    update: {},
    create: {
      id: 'seed-product-glow-serum',
      brandId: brandProfile.id,
      categoryId: categories[1].id,
      name: 'Sérum Facial Glow',
      description: 'Sérum iluminador con vitamina C.',
      marketplace: Marketplace.TIKTOK_SHOP,
      productUrl: 'https://shop.tiktok.com/glow-serum',
    },
  });
  await prisma.campaign.upsert({
    where: { id: 'seed-campaign-glow-launch' },
    update: {},
    create: {
      id: 'seed-campaign-glow-launch',
      brandId: brandProfile.id,
      productId: product.id,
      categoryId: categories[1].id,
      name: 'Lanzamiento Sérum Glow',
      description: 'Buscamos creadoras de belleza para mostrar el uso diario del sérum.',
      marketplace: Marketplace.TIKTOK_SHOP,
      compensationType: CompensationType.HYBRID,
      creatorsRequired: 3,
      deliverableDescription: '1 video corto mostrando aplicación y resultados a las 2 semanas.',
      deliveryDays: 21,
      minFollowers: 5000,
      status: 'PUBLISHED',
    },
  });

  console.log('Seed complete.');
  console.log('  Admin:   admin@creatorcommerce.local / Admin123!');
  console.log('  Creator: creator@creatorcommerce.local / Demo123!');
  console.log('  Brand:   brand@creatorcommerce.local / Demo123!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
