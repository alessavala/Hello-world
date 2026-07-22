-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_creatorId_idx" ON "Favorite"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_brandId_creatorId_key" ON "Favorite"("brandId", "creatorId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
