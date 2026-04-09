-- CreateTable
CREATE TABLE "HQ" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "HQ_pkey" PRIMARY KEY ("id")
);

-- RenameForeignKey
ALTER TABLE "User" RENAME CONSTRAINT "User_hq_fkey" TO "User_hq_wallet_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hq_record_fkey" FOREIGN KEY ("hq") REFERENCES "HQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;
