/*
  Warnings:

  - You are about to drop the column `boothNumber` on the `Publisher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Publisher" DROP COLUMN "boothNumber",
ADD COLUMN     "boothNumbers" TEXT[];
