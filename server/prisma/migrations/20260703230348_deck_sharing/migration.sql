-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Deck_shareId_key" ON "Deck"("shareId");

