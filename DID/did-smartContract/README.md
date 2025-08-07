# Chaincode Network (Fablo + Hyperledger Fabric)

This repository contains the Hyperledger Fabric chaincode and configuration to spin up a local Fabric network using [Fablo](https://github.com/hyperledger-labs/fablo).

---

## ⚙️ Prerequisites

Before starting, make sure you have the following installed:

- **Docker**  
- **Docker Compose**
- **curl**
- **bash**

Verify:

```bash
docker --version
docker compose version   # or docker-compose --version


🚀 Setup & Run the Network
Install Fablo CLI
sudo curl -Lf https://github.com/hyperledger-labs/fablo/releases/download/2.2.0/fablo.sh -o /usr/local/bin/fablo
sudo chmod +x /usr/local/bin/fablo
This downloads the Fablo CLI to your system and makes it executable.

Start the Fabric network

fablo up
This will spin up all the required Hyperledger Fabric containers based on the fablo-config.json configuration.

If you encounter permission issues with Docker:
sudo fablo up
📌 Notes
All containers (peers, orderers, CAs) will be run via Docker Compose in isolated containers.

The generated network files will be available in the fablo-target/ directory.

If needed, you can tear down the network using:
fablo down
Or with sudo:

sudo fablo down
📁 Folder Structure
.
├── chaincode/           # Your smart contracts
├── fablo-config.json    # Fablo network config
├── fablo-target/        # Auto-generated Fabric network files
├── README.md
