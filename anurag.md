# PayAgent: UPI-to-Agent Bridge on Monad

## 1. What is the project about?
**PayAgent** is a middleware bridge that enables Indian UPI users to access the global AI agent economy on the Monad blockchain without ever touching cryptocurrency directly.

## 2. Whom are we helping?
- **Indian UPI Users (600M+):** Users who want to use AI agents (for data analysis, coding, translations, etc.) but find crypto onboarding (KYC, wallets, gas fees) too complex.
- **AI Agents / Developers:** Agents who want to offer their services and tap into the massive Indian market without dealing with local fiat regulations, receiving instant USDC payments instead.

## 3. How is it doing transactions?
Users pay in Indian Rupees (INR) using familiar UPI apps (GPay, PhonePe, Paytm). The backend seamlessly:
1. Converts the fiat payment to USDC.
2. Escrows the funds in a Monad smart contract.
3. Settles the payment to the agent using x-402 micropayments and ERC-8004 agent identity protocols once the service is delivered.

## 4. User Flow
1. **Discover & Hire:** The user browses the marketplace, selects an AI agent, and creates a task.
2. **UPI Payment:** The system displays the price in INR. The user scans a QR code or uses a UPI link to pay via their preferred UPI app.
3. **Escrow:** Upon payment confirmation, the backend locks the equivalent USDC in a Monad escrow smart contract.
4. **Agent Execution:** The selected AI agent detects the escrowed payment, performs the requested task, and submits the deliverable.
5. **Delivery & Settlement:** The user receives the deliverable and confirms it. The escrow contract instantly releases the USDC payment to the agent's wallet.
6. **Feedback:** The user can rate the agent, building their on-chain reputation.

## 5. What problem it solves?
- **Bridges the UPI-Crypto Chasm:** Allows users to participate in the decentralized AI agent economy using everyday fiat payment methods.
- **Removes Crypto Onboarding Friction:** Eliminates the need for centralized exchange KYC, wallet setup, seed phrase management, and understanding gas fees.
- **Enables Microtransactions:** Leverages Monad's high-speed, low-cost blockchain to make micro-payments ($0.10-$1.00) economically viable.
- **Provides a Trust Layer:** Uses smart contract escrows and an immutable reputation system (ERC-8004) to protect both users and agents from fraud or non-delivery.

## 6. Features
- **UPI Payment Integration:** Generate dynamic QR codes and support all major UPI apps (GPay, PhonePe, Paytm).
- **Agent Service Marketplace:** Browse, filter, and hire agents with prices displayed in INR.
- **Escrow Smart Contract:** Trustless fund locking and automated release upon verifiable service delivery.
- **Order Tracking & History:** Real-time tracking of task progress from payment to completion.
- **Agent Registration & Reputation:** Agents mint an ERC-721 identity NFT and build an on-chain reputation based on user feedback.
- **x-402 Payment Reception:** Instant USDC settlement for agents without manual invoicing.
- **Dispute & Refund System:** Built-in mechanisms to raise disputes and issue refunds if an agent fails to deliver.
