import 'dotenv/config';
import './types/express-augment';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { requireAuth } from './middlewares/auth';
import { ProposalController } from './controllers/proposal.controller';
import { DataController } from './controllers/data.controller';
import { AuthController } from './controllers/auth.controller';
import { WalletController } from './controllers/wallet.controller';
import { UserController } from './controllers/user.controller';
import { ProfileController } from './controllers/profile.controller';
import { DfnsController } from './controllers/dfns.controller';
import { CouncilController } from './controllers/council.controller';
import { MemberController } from './controllers/member.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`User connected to WebSocket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Data Routes (Public)
const dataRouter = express.Router();
dataRouter.get('/proposals', DataController.getProposals);
dataRouter.get('/forum', DataController.getForum);
dataRouter.get('/council', DataController.getCouncil);
dataRouter.get('/council-hqs', DataController.getCouncilHqs);
dataRouter.get('/me', DataController.getCurrentUser);
app.use('/api/v1/data', dataRouter);

// Proposal Routes
const proposalRouter = express.Router();
proposalRouter.post('/draft', requireAuth, ProposalController.createDraft);
proposalRouter.post('/:proposalId/publish', requireAuth, ProposalController.publishProposal);
proposalRouter.post('/:proposalId/signaling-vote', requireAuth, ProposalController.castSignalingVote);
app.use('/api/v1/proposals', proposalRouter);

// Auth Routes
const authRouter = express.Router();
authRouter.post('/login', requireAuth, AuthController.memberLogin);
authRouter.post('/onboard', requireAuth, AuthController.memberOnboard);
authRouter.post('/council-login', requireAuth, AuthController.councilLogin);
app.use('/api/v1/auth', authRouter);

// Member Dashboard Routes
const memberRouter = express.Router();
memberRouter.get('/metrics', requireAuth, MemberController.getMetrics);
memberRouter.get('/dashboard', requireAuth, MemberController.getDashboardData);
memberRouter.get('/history', requireAuth, MemberController.getHistory);
memberRouter.get('/delegations', requireAuth, MemberController.getDelegations);
app.use('/api/v1/member-dashboard', memberRouter);


// DFNS Routes
const dfnsRouter = express.Router();
dfnsRouter.post('/create-wallet', requireAuth, DfnsController.createWallet);
dfnsRouter.post('/sign', requireAuth, DfnsController.sign);
app.use('/api/v1/dfns', dfnsRouter);

// Wallet Routes
const walletRouter = express.Router();
walletRouter.post('/hashpack/connect', requireAuth, WalletController.connectHashPack);
walletRouter.post('/metamask/connect', requireAuth, WalletController.connectMetaMask);
walletRouter.get('/me', requireAuth, WalletController.me);
app.use('/api/v1/wallet', walletRouter);

// User Routes
const userRouter = express.Router();
userRouter.get('/me', requireAuth, UserController.me);
app.use('/api/v1/user', userRouter);

// Profile (aggregated identity + wallet + stats)
const profileRouter = express.Router();
profileRouter.get('/me', requireAuth, ProfileController.me);
app.use('/api/v1/profile', profileRouter);

// Council Governance Routes
const councilRouter = express.Router();
councilRouter.get('/metrics', requireAuth, CouncilController.getMetrics);
councilRouter.get('/rules', requireAuth, CouncilController.getRules);
councilRouter.put('/rules', requireAuth, CouncilController.updateRule);
councilRouter.get('/voting-config', requireAuth, CouncilController.getVotingConfig);
councilRouter.put('/voting-config', requireAuth, CouncilController.updateVotingConfig);
councilRouter.get('/elections', requireAuth, CouncilController.getElections);
councilRouter.post('/elections', requireAuth, CouncilController.createElection);
councilRouter.post('/proposals/:id/approve', requireAuth, CouncilController.approveProposal);
councilRouter.post('/proposals/:id/reject', requireAuth, CouncilController.rejectProposal);
councilRouter.get('/giveaways', requireAuth, CouncilController.getGiveaways);
councilRouter.post('/giveaways', requireAuth, CouncilController.createGiveaway);
councilRouter.get('/lotteries', requireAuth, CouncilController.getLotteries);
councilRouter.post('/lotteries', requireAuth, CouncilController.createLottery);
app.use('/api/v1/council', councilRouter);

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok' });
});

// Global Safety Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3001;

prisma.$connect().then(() => {
  console.log("DB CONNECTED");
  server.listen(PORT, () => {
    console.log(`scmn Backend is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("DB CONNECTION FAILED", err);
  process.exit(1);
});
