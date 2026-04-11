-- GovernanceRule
CREATE TABLE "GovernanceRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GovernanceRule_key_key" ON "GovernanceRule"("key");

-- Election
CREATE TYPE "ElectionStatus" AS ENUM ('DRAFT', 'LIVE', 'CLOSED', 'CANCELLED');
CREATE TABLE "Election" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'single_choice',
    "status" "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "require_reputation" BOOLEAN NOT NULL DEFAULT false,
    "allow_delegation" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_eligibility" BOOLEAN NOT NULL DEFAULT false,
    "eligible_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- Candidate
CREATE TABLE "Candidate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "election_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Candidate_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Giveaway
CREATE TABLE "Giveaway" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "description" TEXT,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "require_kyc" BOOLEAN NOT NULL DEFAULT false,
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- Lottery
CREATE TABLE "Lottery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "draw_date" TIMESTAMP(3) NOT NULL,
    "min_reputation" INTEGER NOT NULL DEFAULT 0,
    "is_onchain_random" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lottery_pkey" PRIMARY KEY ("id")
);

-- VotingConfig
CREATE TABLE "VotingConfig" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'number',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VotingConfig_key_key" ON "VotingConfig"("key");

-- VotingRule
CREATE TABLE "VotingRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "enforced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingRule_pkey" PRIMARY KEY ("id")
);

-- Seed governance rules
INSERT INTO "GovernanceRule" ("key","label","value","unit","min","max") VALUES
  ('quorum_threshold','Quorum threshold','51','%',1,100),
  ('voting_window','Voting window','72','hours',1,720),
  ('min_reputation','Min. reputation score','100','pts',0,10000),
  ('delegation_limit','Delegation limit','5','members',1,50),
  ('execution_delay','Execution delay','48','hours',0,168);

-- Seed voting configs
INSERT INTO "VotingConfig" ("key","label","description","value","type") VALUES
  ('voting_window','Voting window (hours)','','72','number'),
  ('min_reputation','Min. reputation to vote','','100','number'),
  ('quorum_threshold','Quorum threshold (%)','','51','number');

-- Seed voting rules
INSERT INTO "VotingRule" ("title","description","enforced") VALUES
  ('Wallet binding required','Members must have a bound Hedera wallet to vote',true),
  ('One vote per member per election','Duplicate votes are rejected at contract level',true),
  ('Votes are final','Once cast, votes cannot be changed or withdrawn',true),
  ('Results visible after close','Vote counts hidden until the voting window closes',true);
