/*
  Warnings:

  - The values [WALLET_CONNECT] on the enum `WalletType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assigned_hq` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dfns_wallet_id]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletType_new" AS ENUM ('DFNS', 'METAMASK');
ALTER TABLE "Wallet" ALTER COLUMN "wallet_type" TYPE "WalletType_new" USING ("wallet_type"::text::"WalletType_new");
ALTER TYPE "WalletType" RENAME TO "WalletType_old";
ALTER TYPE "WalletType_new" RENAME TO "WalletType";
DROP TYPE "WalletType_old";
COMMIT;

-- DropIndex
DROP INDEX "User_assigned_hq_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "assigned_hq",
ADD COLUMN     "alias" TEXT,
ADD COLUMN     "hq" TEXT,
ADD COLUMN     "is_onboarded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "dfns_wallet_id" TEXT,
ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "HQWallet" (
    "id" UUID NOT NULL,
    "hq" TEXT NOT NULL,
    "dfns_wallet_id" TEXT NOT NULL,
    "hedera_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HQWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HQWallet_hq_key" ON "HQWallet"("hq");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_dfns_wallet_id_key" ON "Wallet"("dfns_wallet_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hq_fkey" FOREIGN KEY ("hq") REFERENCES "HQWallet"("hq") ON DELETE SET NULL ON UPDATE CASCADE;
