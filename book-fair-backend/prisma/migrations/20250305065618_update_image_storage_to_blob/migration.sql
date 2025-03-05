-- CreateTable
CREATE TABLE "AboutEvent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "video" BYTEA,

    CONSTRAINT "AboutEvent_pkey" PRIMARY KEY ("id")
);
