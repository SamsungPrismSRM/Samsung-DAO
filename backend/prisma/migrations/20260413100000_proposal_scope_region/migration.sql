CREATE TYPE "ProposalScope" AS ENUM ('LOCAL', 'GLOBAL');
CREATE TYPE "ProposalRegion" AS ENUM ('INDIA', 'KOREA', 'US');

ALTER TABLE "Proposal"
ADD COLUMN "scope" "ProposalScope" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "region" "ProposalRegion";
