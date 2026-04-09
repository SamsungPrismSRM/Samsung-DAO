-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'COUNCIL', 'ADMIN');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('DFNS', 'WALLET_CONNECT');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('FEATURE', 'LOTTERY', 'TOKEN');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SIGNALING', 'ON_CHAIN_VOTE', 'PASSED', 'FAILED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('YES', 'NO', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "VoteSource" AS ENUM ('ON_CHAIN', 'OFF_CHAIN');

-- CreateEnum
CREATE TYPE "LotteryStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('TOKEN', 'NFT', 'FIAT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "is_wallet_created" BOOLEAN NOT NULL DEFAULT false,
    "assigned_hq" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "wallet_type" "WalletType" NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'HEDERA_TESTNET',
    "is_custodial" BOOLEAN NOT NULL DEFAULT false,
    "is_multisig" BOOLEAN NOT NULL DEFAULT false,
    "is_council_wallet" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "ipfs_cid" TEXT,
    "onchain_proposal_id" TEXT,
    "created_by" UUID NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVersion" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalingVote" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote_type" "VoteType" NOT NULL,
    "voting_power" DECIMAL(20,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalingVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnchainVote" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "vote_type" "VoteType" NOT NULL,
    "voting_power" DECIMAL(20,4) NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnchainVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalResult" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "yes_votes" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "no_votes" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "abstain_votes" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "total_votes" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "source" "VoteSource" NOT NULL,
    "finalized_at" TIMESTAMP(3),

    CONSTRAINT "ProposalResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryTransaction" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "token_type" TEXT NOT NULL,
    "recipient_wallet" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumComment" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryEvent" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "reward_pool" DECIMAL(36,18) NOT NULL,
    "status" "LotteryStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryParticipant" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "tickets" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LotteryParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "RewardType" NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "reference_id" TEXT,
    "transaction_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebase_uid_key" ON "User"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_assigned_hq_key" ON "User"("assigned_hq");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_wallet_address_key" ON "Wallet"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_onchain_proposal_id_key" ON "Proposal"("onchain_proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "SignalingVote_proposal_id_user_id_key" ON "SignalingVote"("proposal_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainVote_transaction_hash_key" ON "OnchainVote"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainVote_proposal_id_wallet_address_key" ON "OnchainVote"("proposal_id", "wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalResult_proposal_id_key" ON "ProposalResult"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryTransaction_transaction_hash_key" ON "TreasuryTransaction"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_name_key" ON "ForumCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryParticipant_event_id_user_id_key" ON "LotteryParticipant"("event_id", "user_id");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalingVote" ADD CONSTRAINT "SignalingVote_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalingVote" ADD CONSTRAINT "SignalingVote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnchainVote" ADD CONSTRAINT "OnchainVote_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalResult" ADD CONSTRAINT "ProposalResult_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransaction" ADD CONSTRAINT "TreasuryTransaction_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ForumCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "ForumPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryEvent" ADD CONSTRAINT "LotteryEvent_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryParticipant" ADD CONSTRAINT "LotteryParticipant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "LotteryEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryParticipant" ADD CONSTRAINT "LotteryParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
