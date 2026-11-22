-- AlterTable
ALTER TABLE "CreatorMarketplace" ADD COLUMN     "availableForLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "availableForProductCollab" BOOLEAN NOT NULL DEFAULT false;
