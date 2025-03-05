-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "text" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
