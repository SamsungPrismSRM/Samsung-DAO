import { PrismaClient, ProposalType, ProposalStatus, Role, WalletType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Clear existing
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.forumCategory.deleteMany();
  await prisma.onchainVote.deleteMany();
  await prisma.signalingVote.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  console.log('Creating users...');
  const member = await prisma.user.create({
    data: {
      firebase_uid: 'uid-member-1',
      name: 'Samsung Member',
      email: 'member@samsung.com',
      role: Role.MEMBER,
      wallets: {
        create: {
          wallet_address: '0xabc123...', // Fake on-chain address
          wallet_type: WalletType.DFNS
        }
      }
    }
  });

  const councilLeader = await prisma.user.create({
    data: {
      firebase_uid: 'uid-council-1',
      name: 'Dr. Kim Hyun-soo',
      email: 'khs@samsung.com',
      role: Role.COUNCIL,
      wallets: {
        create: {
          wallet_address: '0x1a2b...3c4d',
          wallet_type: WalletType.METAMASK,
          is_council_wallet: true
        }
      }
    }
  });

  const councilDev = await prisma.user.create({
    data: {
      firebase_uid: 'uid-council-2',
      name: 'Lee Min-ji',
      email: 'lmj@samsung.com',
      role: Role.COUNCIL,
      wallets: {
        create: {
          wallet_address: '0x5e6f...7g8h',
          wallet_type: WalletType.METAMASK,
          is_council_wallet: true
        }
      }
    }
  });

  // 2. Create Proposals
  console.log('Creating proposals...');
  const proposal1 = await prisma.proposal.create({
    data: {
      title: 'Integrate AI-Powered Camera Suggestions in Galaxy S Series',
      description: 'This proposal aims to integrate advanced AI algorithms into the Galaxy S camera system, enabling real-time scene detection and photography suggestions. The AI engine will analyze composition, lighting, and subject matter to provide users with actionable tips before they capture a photo. This will enhance the photography experience for both amateur and professional users, positioning Samsung ahead of competitors in computational photography.',
      type: ProposalType.FEATURE,
      status: ProposalStatus.ON_CHAIN_VOTE, // Simulates 'active' mock
      created_by: member.id,
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      signaling_votes: {
        create: [
          { user_id: councilLeader.id, vote_type: 'YES', voting_power: 15000 },
          { user_id: councilDev.id, vote_type: 'YES', voting_power: 12000 },
        ]
      }
    }
  });

  const proposal2 = await prisma.proposal.create({
    data: {
      title: 'Galaxy Wearable Lottery — Win Galaxy Ring 2',
      description: 'Monthly lottery program where Samsung Members can enter to win the upcoming Galaxy Ring 2. Each governance participation earns lottery entries. This lottery aims to drive engagement and reward active community members.',
      type: ProposalType.LOTTERY,
      status: ProposalStatus.ON_CHAIN_VOTE,
      created_by: councilLeader.id,
      end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  // 3. Create Forum
  console.log('Creating forum data...');
  const categoryIdeas = await prisma.forumCategory.create({
    data: { name: 'Product Ideas' }
  });
  const categoryBugs = await prisma.forumCategory.create({
    data: { name: 'Bug Reports' }
  });

  await prisma.forumPost.create({
    data: {
      category_id: categoryIdeas.id,
      title: 'Should Samsung integrate Hedera into Samsung Pay?',
      content: 'I think integrating Hedera would vastly reduce fees.',
      user_id: member.id,
      tags: ['Samsung Pay', 'Hedera']
    }
  });

  await prisma.forumPost.create({
    data: {
      category_id: categoryBugs.id,
      title: 'Bug: One UI 7 notification grouping not working',
      content: 'Has anyone else noticed this on S24?',
      user_id: member.id,
      tags: ['One UI', 'Bug']
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
