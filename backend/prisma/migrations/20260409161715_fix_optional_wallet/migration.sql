-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_hq_wallet_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hq_wallet_id" UUID;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hq_wallet_fkey" FOREIGN KEY ("hq_wallet_id") REFERENCES "HQWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
