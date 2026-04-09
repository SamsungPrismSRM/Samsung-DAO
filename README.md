# Samsung Members DAO Governance System

## Overview

Samsung Members DAO Governance System is an enterprise-grade decentralized governance infrastructure designed to manage global organizational decision-making using blockchain principles, secure identity, and institutional custody.

This system transforms traditional centralized governance into a distributed, cryptographically secure, and auditable framework where regional headquarters (HQs) act as sovereign nodes participating in decision-making and execution.

The architecture integrates authentication, authorization, custody, and execution layers into a unified system, enabling real-world DAO operations backed by MPC (Multi-Party Computation) wallets.

---

## Core Architecture

### 1. Identity Layer
- Firebase Authentication (Google + Email/Password)
- Role-based access:
  - Samsung Members (community participants)
  - Samsung Council Members (governance authorities)

### 2. Authorization Layer
- Backend JWT-based session management
- Firebase token verification middleware
- Role enforcement (MEMBER vs COUNCIL)

### 3. Custody Layer
- DFNS MPC Wallet Infrastructure
- Shared institutional wallet across 15 Samsung HQs
- Secure key management using Ed25519 cryptography
- No single point of private key exposure

### 4. Execution Layer
- Hedera Network (Testnet/Mainnet ready)
- Transaction execution via DFNS signing requests
- Multi-signature approval workflow

---

## System Design

### Council Governance Model

- Total Nodes: 15 Regional HQs
- Voting Mechanism: 1 HQ = 1 vote
- Threshold: 8/15 approvals required
- Execution: Triggered after threshold is met

### Member Model

- Non-custodial participation via MetaMask
- Wallet ownership fully controlled by user
- Used for signaling, participation, and ecosystem engagement

---

## Authentication Flows

### Member Flow
1. Firebase Authentication (Google)
2. Backend JWT issuance
3. MetaMask connection (Hedera Testnet)
4. Wallet verification via signature
5. Dashboard access

### Council Flow
1. Firebase Authentication (Email/Password)
2. HQ auto-detection (email + timezone mapping)
3. Backend council login verification
4. DFNS MPC wallet creation (if not exists)
5. Wallet persistence across sessions

---

## DFNS Integration

### Features
- MPC wallet creation
- Secure transaction signing
- Multi-party approval enforcement
- Institutional-grade custody model
