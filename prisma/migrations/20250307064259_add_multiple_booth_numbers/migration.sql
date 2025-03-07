/*
  Warnings:

  - The `boothNumber` column on the `Publisher` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Publisher" DROP COLUMN "boothNumber",
ADD COLUMN     "boothNumber" TEXT[];
