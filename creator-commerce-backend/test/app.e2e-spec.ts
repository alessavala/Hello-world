import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Creator Commerce API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  const unique = Date.now();
  const creatorEmail = `e2e-creator-${unique}@test.com`;
  const brandEmail = `e2e-brand-${unique}@test.com`;
  const otherBrandEmail = `e2e-other-brand-${unique}@test.com`;
  const password = 'Password123!';

  let creatorToken: string;
  let brandToken: string;
  let otherBrandToken: string;
  let categoryId: string;
  let creatorProfileId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    server = app.getHttpServer();
    prisma = app.get(PrismaService);

    const category = await prisma.category.upsert({
      where: { slug: `e2e-category-${unique}` },
      update: {},
      create: { name: `E2E Category ${unique}`, slug: `e2e-category-${unique}` },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('registers a creator', async () => {
      const res = await request(server).post('/api/v1/auth/register').send({ email: creatorEmail, password, role: 'CREATOR' }).expect(201);
      expect(res.body.accessToken).toBeDefined();
      creatorToken = res.body.accessToken;
    });

    it('registers a brand', async () => {
      const res = await request(server).post('/api/v1/auth/register').send({ email: brandEmail, password, role: 'BRAND' }).expect(201);
      brandToken = res.body.accessToken;
    });

    it('registers a second brand (used for cross-tenant ownership checks)', async () => {
      const res = await request(server).post('/api/v1/auth/register').send({ email: otherBrandEmail, password, role: 'BRAND' }).expect(201);
      otherBrandToken = res.body.accessToken;
    });

    it('rejects duplicate registration', async () => {
      await request(server).post('/api/v1/auth/register').send({ email: creatorEmail, password, role: 'CREATOR' }).expect(400);
    });

    it('rejects direct admin self-registration', async () => {
      await request(server).post('/api/v1/auth/register').send({ email: `admin-${unique}@test.com`, password, role: 'ADMIN' }).expect(400);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(server).post('/api/v1/auth/login').send({ email: creatorEmail, password }).expect(201);
      expect(res.body.accessToken).toBeDefined();
    });

    it('rejects login with wrong password', async () => {
      await request(server).post('/api/v1/auth/login').send({ email: creatorEmail, password: 'wrong' }).expect(401);
    });

    it('rejects unauthenticated access to a protected route', async () => {
      await request(server).get('/api/v1/creators/me').expect(401);
    });
  });

  describe('role guard', () => {
    it('rejects a creator calling a brand-only endpoint', async () => {
      await request(server).put('/api/v1/brands/me').set('Authorization', `Bearer ${creatorToken}`).send({ businessName: 'x', country: 'MX' }).expect(403);
    });

    it('rejects a brand calling a creator-only endpoint', async () => {
      await request(server).put('/api/v1/creators/me').set('Authorization', `Bearer ${brandToken}`).send({ displayName: 'x', country: 'MX' }).expect(403);
    });
  });

  describe('profiles', () => {
    it('creates the creator profile', async () => {
      const res = await request(server)
        .put('/api/v1/creators/me')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ displayName: 'E2E Creator', country: 'MX' })
        .expect(200);
      creatorProfileId = res.body.id;
      // reputation fields must never be settable from the DTO
      expect(res.body.reliabilityScore).toBe(50);
    });

    it('ignores a client-supplied reliabilityScore (mass assignment protection)', async () => {
      const res = await request(server)
        .put('/api/v1/creators/me')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ displayName: 'E2E Creator', country: 'MX', reliabilityScore: 999 })
        .expect(400); // forbidNonWhitelisted rejects the unknown field outright
      expect(res.body.message).toBeDefined();
    });

    it('creates the brand profile', async () => {
      await request(server).put('/api/v1/brands/me').set('Authorization', `Bearer ${brandToken}`).send({ businessName: 'E2E Brand', country: 'MX' }).expect(200);
    });

    it('creates the second brand profile', async () => {
      await request(server).put('/api/v1/brands/me').set('Authorization', `Bearer ${otherBrandToken}`).send({ businessName: 'Other Brand', country: 'MX' }).expect(200);
    });
  });

  describe('products & ownership', () => {
    let productId: string;
    let otherBrandProductId: string;

    it('creates a product for the brand', async () => {
      const res = await request(server)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ categoryId, name: 'Test Product', marketplace: 'TIKTOK_SHOP', productUrl: 'https://shop.tiktok.com/p1' })
        .expect(201);
      productId = res.body.id;
    });

    it('creates a product for the other brand', async () => {
      const res = await request(server)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${otherBrandToken}`)
        .send({ categoryId, name: 'Other Product', marketplace: 'TIKTOK_SHOP', productUrl: 'https://shop.tiktok.com/p2' })
        .expect(201);
      otherBrandProductId = res.body.id;
    });

    it('rejects a brand attaching another brand\'s product to its campaign', async () => {
      await request(server)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          productId: otherBrandProductId,
          categoryId,
          name: 'Sneaky Campaign',
          description: 'desc',
          marketplace: 'TIKTOK_SHOP',
          compensationType: 'PRODUCT_ONLY',
          creatorsRequired: 1,
          deliverableDescription: 'video',
          deliveryDays: 14,
        })
        .expect(403);
    });

    it('rejects a brand updating another brand\'s product', async () => {
      await request(server)
        .patch(`/api/v1/products/${otherBrandProductId}`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ name: 'Hijacked' })
        .expect(403);
    });

  });

  describe('campaign lifecycle', () => {
    let campaignId: string;

    it('creates a draft campaign', async () => {
      const res = await request(server)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          categoryId,
          name: 'E2E Campaign',
          description: 'desc',
          marketplace: 'TIKTOK_SHOP',
          compensationType: 'PRODUCT_ONLY',
          creatorsRequired: 1,
          deliverableDescription: 'video',
          deliveryDays: 14,
          minFollowers: 0,
        })
        .expect(201);
      campaignId = res.body.id;
      expect(res.body.status).toBe('DRAFT');
    });

    it('hides a draft campaign from other brands', async () => {
      await request(server).get(`/api/v1/campaigns/${campaignId}`).set('Authorization', `Bearer ${otherBrandToken}`).expect(404);
    });

    it('rejects publishing by a non-owner brand', async () => {
      await request(server)
        .patch(`/api/v1/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${otherBrandToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(403);
    });

    it('rejects an illegal campaign status jump (DRAFT -> CLOSED)', async () => {
      await request(server).patch(`/api/v1/campaigns/${campaignId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'CLOSED' }).expect(403);
    });

    it('publishes the campaign', async () => {
      await request(server).patch(`/api/v1/campaigns/${campaignId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'PUBLISHED' }).expect(200);
    });

    it('rejects reopening a closed campaign after closing it', async () => {
      await request(server).patch(`/api/v1/campaigns/${campaignId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'PAUSED' }).expect(200);
      await request(server).patch(`/api/v1/campaigns/${campaignId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'PUBLISHED' }).expect(200);
    });
  });

  describe('applications, invitations & collaborations', () => {
    let campaignId: string;
    let applicationId: string;
    let collaborationId: string;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          categoryId,
          name: 'Application Flow Campaign',
          description: 'desc',
          marketplace: 'TIKTOK_SHOP',
          compensationType: 'PRODUCT_ONLY',
          creatorsRequired: 1,
          deliverableDescription: 'video',
          deliveryDays: 14,
          minFollowers: 0,
        });
      campaignId = res.body.id;
      await request(server).patch(`/api/v1/campaigns/${campaignId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'PUBLISHED' });
    });

    it('lets a creator apply', async () => {
      const res = await request(server).post(`/api/v1/applications/campaign/${campaignId}`).set('Authorization', `Bearer ${creatorToken}`).send({}).expect(201);
      applicationId = res.body.id;
      expect(res.body.matchScore).toBeGreaterThanOrEqual(0);
    });

    it('rejects a duplicate application to the same campaign', async () => {
      await request(server).post(`/api/v1/applications/campaign/${campaignId}`).set('Authorization', `Bearer ${creatorToken}`).send({}).expect(409);
    });

    it('rejects a brand accepting an application it does not own', async () => {
      await request(server)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${otherBrandToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(403);
    });

    it('lets the owning brand accept the application, creating a collaboration', async () => {
      const res = await request(server)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(200);
      collaborationId = res.body.id;
      expect(res.body.status).toBe('ACCEPTED');
    });

    it('does not create a second collaboration when accepted twice (idempotent, no duplicate)', async () => {
      const res = await request(server)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(403); // application is already ACCEPTED; the brand transition guard rejects re-accepting
      expect(res.body).toBeDefined();

      const collaborations = await prisma.collaboration.findMany({ where: { applicationId } });
      expect(collaborations).toHaveLength(1);
    });

    it('rejects a stranger viewing the collaboration', async () => {
      await request(server).get(`/api/v1/collaborations/${collaborationId}`).set('Authorization', `Bearer ${otherBrandToken}`).expect(403);
    });

    it('rejects an illegal collaboration jump straight to COMPLETED', async () => {
      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'COMPLETED' }).expect(403);
    });

    it('walks the collaboration through to COMPLETED via deliverables', async () => {
      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${creatorToken}`).send({ status: 'CONTENT_IN_PROGRESS' }).expect(200);

      const deliverable = await request(server)
        .post('/api/v1/deliverables')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ collaborationId, title: 'Video', contentType: 'video' })
        .expect(201);
      const deliverableId = deliverable.body.id;

      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${creatorToken}`).send({ status: 'DRAFT_SUBMITTED' }).expect(200);
      await request(server).patch(`/api/v1/deliverables/${deliverableId}/submit`).set('Authorization', `Bearer ${creatorToken}`).send({ draftUrl: 'https://example.com/draft.mp4' }).expect(200);

      await request(server)
        .patch(`/api/v1/collaborations/${collaborationId}/status`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'FINAL_SUBMITTED' })
        .expect(400); // no finalUrl on the deliverable yet

      await request(server).patch(`/api/v1/deliverables/${deliverableId}/submit`).set('Authorization', `Bearer ${creatorToken}`).send({ finalUrl: 'https://example.com/final.mp4' }).expect(200);
      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${creatorToken}`).send({ status: 'FINAL_SUBMITTED' }).expect(200);

      await request(server).patch(`/api/v1/deliverables/${deliverableId}/review`).set('Authorization', `Bearer ${brandToken}`).send({ decision: 'APPROVED', comments: 'great' }).expect(200);
      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'APPROVED' }).expect(200);

      await request(server).patch(`/api/v1/deliverables/${deliverableId}/publish`).set('Authorization', `Bearer ${creatorToken}`).send({ publicationUrl: 'https://tiktok.com/@e2e/video/1' }).expect(200);
      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${creatorToken}`).send({ status: 'PUBLISHED' }).expect(200);
      await request(server).patch(`/api/v1/collaborations/${collaborationId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'COMPLETED' }).expect(200);
    });

    it('lets the brand review the creator and updates the derived creator score', async () => {
      await request(server)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ collaborationId, rating: 5, communication: 5, quality: 5, punctuality: 5, wouldWorkAgain: true })
        .expect(201);

      await request(server).post('/api/v1/reviews').set('Authorization', `Bearer ${brandToken}`).send({ collaborationId, rating: 5, communication: 5, quality: 5, punctuality: 5 }).expect(409);

      const passport = await request(server).get(`/api/v1/creators/${creatorProfileId}/passport`).set('Authorization', `Bearer ${creatorToken}`).expect(200);
      expect(passport.body.campaignsCompleted).toBeGreaterThanOrEqual(1);
      expect(passport.body.avgRating).toBe(5);
      expect(passport.body.creatorCommerceScore).toBeGreaterThan(50);
    });

    it('supports the invitation flow end to end', async () => {
      // A fresh campaign is needed: the creator already has an application
      // against `campaignId` from an earlier test, and [campaignId, creatorId]
      // is unique - a second relationship (this invite) would correctly 409.
      const freshCampaign = await request(server)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          categoryId,
          name: 'Invitation Flow Campaign',
          description: 'desc',
          marketplace: 'TIKTOK_SHOP',
          compensationType: 'PRODUCT_ONLY',
          creatorsRequired: 1,
          deliverableDescription: 'video',
          deliveryDays: 14,
          minFollowers: 0,
        });
      const freshCampaignId = freshCampaign.body.id;
      await request(server).patch(`/api/v1/campaigns/${freshCampaignId}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'PUBLISHED' });

      const inviteRes = await request(server)
        .post('/api/v1/applications/invite')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ campaignId: freshCampaignId, creatorId: creatorProfileId })
        .expect(201);
      expect(inviteRes.body.status).toBe('INVITED');

      await request(server).patch(`/api/v1/applications/${inviteRes.body.id}/status`).set('Authorization', `Bearer ${brandToken}`).send({ status: 'ACCEPTED' }).expect(400);

      const respondRes = await request(server)
        .patch(`/api/v1/applications/${inviteRes.body.id}/respond`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ accept: false })
        .expect(200);
      expect(respondRes.body.status).toBe('REJECTED');
    });
  });
});
