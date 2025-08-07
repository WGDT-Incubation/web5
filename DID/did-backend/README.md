# DID Backend

A robust Node.js backend service for Decentralized Identity (DID) management, supporting certificate issuance, verification, and user/admin workflows. Built for scalability, security, and integration with blockchain-based smart contracts.

---

## 🚀 Features
- Decentralized Identity (DID) management
- Certificate issuance, preview, and verification (multiple types supported)
- Role-based authentication (User, Admin, SuperAdmin, Verifier)
- OTP-based login and verification
- Integration with blockchain smart contracts
- RESTful API design
- Modular, extensible architecture
- Logging, error handling, and security best practices

---

## 🏗️ Architecture
```
[Client Apps]
     |
 [Express.js API Layer]
     |
[MongoDB]   [Blockchain Smart Contract Service]
```
- **Express.js**: API server, routing, middleware
- **MongoDB**: Persistent storage for users, certificates, DIDs
- **Blockchain Service**: External service for DID smart contract operations

---

## 🛠️ Tech Stack
- Node.js (v16+)
- Express.js
- MongoDB
- TypeScript
- JWT (Authentication)
- dotenv, morgan, winston (Logging)
- nodemon (Dev)

---

## 📦 Prerequisites
- Node.js v16 or above
- npm
- MongoDB (running and accessible)
- DID Smart Contract service (running separately)

---

## ⚙️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in the required values:
     ```env
     MONGO_URI=mongodb://localhost:27017/did_db
     DB_NAME=did_db
     JWT_SECRET=your_jwt_secret
     ENCRYPTION_KEY=your_encryption_key
     CHAINCODE_INVOKE_API_URL=http://blockchain-service/api
     USER_ENROLL_API_URL=http://blockchain-service/enroll
     USER_ID=blockchain_user_id
     USER_SECRET=blockchain_user_secret
     TWILIO_ACCOUNT_SID=your_twilio_sid
     TWILIO_AUTH_TOKEN=your_twilio_token
     TWILIO_FROM=your_twilio_number
     LOG_LEVEL=info
     FETCH_URL=http://external-api/edistrict
     ```

---

## 🏃 Running the Application

- **Development (with hot reload):**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm run build
  npm start
  ```
- **Directly (for quick start pm2 daemon):**
  ```bash
  npm run start-server
  ```



---


## 🚀 Deployment
- Use a process manager like PM2 or Docker for production deployments.
- Ensure all environment variables are set securely.
- Example (with PM2):
  ```bash
  pm2 start dist/index.js --name did-backend
  ```



## 🔒 Security
- All sensitive endpoints require JWT authentication.
- Never commit secrets or credentials to the repository.
- Use HTTPS in production.
- Regularly update dependencies for security patches.

---
