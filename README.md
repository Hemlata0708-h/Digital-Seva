# 🛕 DevTemple: Blockchain-Based Fund Management System For Indian Temples

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)
![Polygon](https://img.shields.io/badge/Polygon-%238247E5.svg?style=for-the-badge&logo=polygon&logoColor=white)

DevTemple is a **Decentralized Web3 Application (DApp)** aimed at bringing absolute transparency, traceability, and security to the religious donation ecosystem in India. By leveraging Ethereum smart contracts deployed on the **Polygon (MATIC)** network, it eliminates the need for centralized intermediaries and prevents fund misappropriation. 

---

## 🌟 Key Features

*   **🦊 Web3 Wallet Integration:** Seamlessly connect MetaMask to initiate transactions securely.
*   **🪙 Cryptocurrency Donations:** Donors can directly transfer assets (MATIC/ETH) to specific temples with incredibly low transaction fees.
*   **📊 Transparent Analytics Dashboard:** Real-time visualization of incoming funds, transaction ledgers, and geographical distributions using **Recharts**.
*   **🔐 Immutable Ledgers:** Once a transaction is processed via the Smart Contract, it's permanently recorded on the blockchain—creating a 100% public audit trail.
*   **⛩️ Temple Admin Portal:** Dedicated dashboards for Temple Administrators to register their institutions and track specific allocations.
*   **📄 Automated Receipts:** Instantly generated PDF receipts providing cryptographic verification of the donation for tax benefits.

---

## 🛠️ Technology Stack

### **Frontend (Client-Side)**
*   **Next.js (App Router)** - React framework for SSR and performance optimization.
*   **React 18** - UI Component Library.
*   **Tailwind CSS** - Utility-first styling for deep, custom, and responsive UI.
*   **Ethers.js (v6)** - Comprehensive library to connect the UI to the Ethereum Virtual Machine (EVM) and MetaMask.
*   **Recharts** - Composable charting library for interactive data metrics.
*   **Framer Motion** - Fluid animations for better User Experience.

### **Backend (Data & API)**
*   **Node.js & Express.js** - Lightweight server for handling off-chain metadata (Temple images, bios, caching).
*   **MongoDB & Mongoose** - Database for linking blockchain hashes to human-readable UI structures without incurring massive on-chain gas fees.

### **Blockchain (Web3)**
*   **Solidity** - Object-oriented language for writing immutable Smart Contracts.
*   **Hardhat** - Development environment to compile, deploy, test, and debug Ethereum software locally.
*   **Polygon Amoy Testnet** - Layer-2 scaling network for Ethereum to ensure fast transactions with minimal gas fees.

---

## 🏗️ System Architecture Flow

1. **User Request:** Devotee clicks "Donate" on the Next.js Frontend.
2. **Signature Request:** Frontend requests transaction authorization via Ethers.js to the user's local MetaMask wallet.
3. **Execution:** Upon approval, the payload is broadcasted to the Polygon RPC node.
4. **Smart Contract:** `TempleFund.sol` intercepts the transaction, validates amounts, executing real-time fund transfer to the target Temple Wallet Address.
5. **Event Emission:** Contract emits a `DonationReceived` event.
6. **Frontend Update:** UI catches the event, updates the MongoDB cache for fast querying, and redirects to the Success Receipt page.

---

## 🚀 Local Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)
*   MetaMask Browser Extension (Set to Polygon Amoy Testnet)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Blockchain-Indian-Temples.git
cd Blockchain-Indian-Temples
```

### 2. Backend Setup
```bash
cd Backend
npm install
# Create a .env file and add your MongoDB String & JWT Secrets
npm run start
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
# Create a .env.local file if you need custom RPC URLs
npm run dev
```

### 4. Smart Contract Deployment (Optional/For Development)
```bash
# Navigate to your Hardhat directory
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```
*Note: Make sure to update the `TEMPLE_FUND_ADDRESS` and `ABI` in the Frontend `utils` directory if deploying a new contract.*

---

## 💡 Future Scope
*   **Fiat-to-Crypto On-Ramp:** Integration with third-party gateways (e.g., Transak) ensuring devotees can pay via UPI/Debit Cards, while funds are converted to crypto under the hood.
*   **NFT Certificates:** Issuing soul-bound NFTs to donors as a digitally immutable proof of their contributions.
*   **Governance Voting (DAO):** Allowing recurring donors to vote on Temple expenditure proposals (e.g., Building a clinic vs. Annadaan).

---

## 🤝 Contribution
Contributions, issues, and feature requests are welcome!
