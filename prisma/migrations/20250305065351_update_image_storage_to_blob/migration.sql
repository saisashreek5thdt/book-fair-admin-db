/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Banner` table. All the data in the column will be lost.
  - The `logo` column on the `Publisher` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `imageUrl` on the `Speaker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "imageUrl",
ADD COLUMN     "image" BYTEA,
ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Publisher" DROP COLUMN "logo",
ADD COLUMN     "logo" BYTEA;

-- AlterTable
ALTER TABLE "Speaker" DROP COLUMN "imageUrl",
ADD COLUMN     "image" BYTEA;

-- CreateTable
CREATE TABLE "Gallery" (
    "id" SERIAL NOT NULL,
    "image" BYTEA NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "image" BYTEA NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" SERIAL NOT NULL,
    "image" BYTEA NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);
