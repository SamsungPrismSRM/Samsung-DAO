-- Add normalized region to users
ALTER TABLE "User"
ADD COLUMN "region" "ProposalRegion";

UPDATE "User" u
SET "region" = CASE UPPER(h.region)
  WHEN 'INDIA' THEN 'INDIA'::"ProposalRegion"
  WHEN 'KOREA' THEN 'KOREA'::"ProposalRegion"
  WHEN 'US' THEN 'US'::"ProposalRegion"
  ELSE NULL
END
FROM "HQ" h
WHERE u.hq = h.id
  AND u.region IS NULL;

-- Add scope/region to elections
ALTER TABLE "Election"
ADD COLUMN "scope" "ProposalScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN "region" "ProposalRegion";

-- Add scope/region to giveaways
ALTER TABLE "Giveaway"
ADD COLUMN "scope" "ProposalScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN "region" "ProposalRegion";

-- Add scope/region to lotteries
ALTER TABLE "Lottery"
ADD COLUMN "scope" "ProposalScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN "region" "ProposalRegion";
