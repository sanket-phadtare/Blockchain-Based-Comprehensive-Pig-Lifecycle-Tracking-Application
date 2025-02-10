import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pg from 'pg';
import Web3 from 'web3';
import axios from 'axios';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import winston from 'winston';

const { Pool } = pg;
dotenv.config();
const app = express();
app.use(express.json());


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

const pinata_api = process.env.PINATA_API_KEY;
const pinata_secret = process.env.PINATA_API_SECRET;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});



const web3 = new Web3('https://rpc-amoy.polygon.technology/');
const contractABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "vaccine_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "addVaccination",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "qr_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "generateQRCode",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {"inputs": [], "stateMutability": "nonpayable", "type": "constructor"},
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false, "internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"indexed": false, "internalType": "bytes32", "name": "pig_hash", "type": "bytes32"},
            {"indexed": false, "internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "PigRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false, "internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"indexed": false, "internalType": "bytes32", "name": "qr_hash", "type": "bytes32"},
            {"indexed": false, "internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "QRCodeGenerated",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "sales_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "recordSale",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "pig_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "registerPig",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false, "internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"indexed": false, "internalType": "bytes32", "name": "sales_hash", "type": "bytes32"},
            {"indexed": false, "internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "SaleRecorded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false, "internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"indexed": false, "internalType": "bytes32", "name": "vaccine_hash", "type": "bytes32"},
            {"indexed": false, "internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "name": "VaccinationAdded",
        "type": "event"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "pigg_id", "type": "uint256"}],
        "name": "getPigData",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "bytes32", "name": "", "type": "bytes32"},
            {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "pigg_id", "type": "uint256"}],
        "name": "getQRData",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "bytes32", "name": "", "type": "bytes32"},
            {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "pigg_id", "type": "uint256"}],
        "name": "getSalesData",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "bytes32", "name": "", "type": "bytes32"},
            {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "pigg_id", "type": "uint256"}],
        "name": "getVaccinationData",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "bytes32", "name": "", "type": "bytes32"},
            {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {"internalType": "address", "name": "", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "pigData",
        "outputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "pig_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "qrData",
        "outputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "qr_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "salesData",
        "outputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "sales_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "vaccinationData",
        "outputs": [
            {"internalType": "uint256", "name": "pig_id", "type": "uint256"},
            {"internalType": "bytes32", "name": "vaccine_hash", "type": "bytes32"},
            {"internalType": "string", "name": "ipfs_cid", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
  
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);
const privateKey = process.env.PRIVATE_KEY;
const walletAddress = process.env.WALLET_ADDRESS;

function hashWithSalt(value) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = keccak256(salt + value).toString('hex');
    return { salt, hash };
}

async function uploadToIPFS(data, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
                headers: {
                    pinata_api_key: pinata_api,
                    pinata_secret_api_key: pinata_secret,
                },
            });
            return response.data.IpfsHash;
        } catch (error) {
            logger.error(`Attempt ${i + 1} failed to upload to IPFS: ${error.message}`);
        }
    }
    throw new Error("Failed to upload data to IPFS");
}

async function sendBlockchainTransaction(method, params) {
    try {
        const txData = method(...params).encodeABI();
        const gasEstimate = await method(...params).estimateGas({ from: walletAddress });
        const gasPriceWei = await web3.eth.getGasPrice();
        const gasPriceBigInt = BigInt(gasPriceWei);

        const nonce = await web3.eth.getTransactionCount(walletAddress);

        const txObject = {
            to: contractAddress,
            data: txData,
            gas: Math.floor(Number(gasEstimate) * 1.2),  
            gasPrice: gasPriceBigInt.toString(), 
            nonce: Number(nonce), 
        };

        const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
    } catch (error) {
        logger.error(`Blockchain transaction failed: ${error.message}`);
        throw error;
    }
}

app.post('/api/pigs', async function(req,res)
{
    try {
        const { pigId, birthDate, soldAt, breed, geneticLineage, birthWeight, earTag, sex, status, farmId } = req.body;
        logger.info("Calculating Merkle");

        const saltedHashes = [pigId, birthDate, soldAt, breed, geneticLineage, birthWeight, earTag, sex, status, farmId ].map(hashWithSalt);
        const salts = saltedHashes.map(hash => hash.salt);
        const leaves = saltedHashes.map(hash => hash.hash);

        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const merkleroot = "0x" + tree.getRoot().toString("hex");

        const qrId = Math.floor(Math.random() * 1000);
        const qrCodeBase64 = Buffer.from(pigId.toString()).toString('base64');

        const ipfsData = { pigId, birthDate, soldAt, breed, geneticLineage, birthWeight, earTag, sex, status, farmId };
        const ipfs_cid = await uploadToIPFS(ipfsData);
        logger.info("Data added to IPFS");

        
        const receipt = await sendBlockchainTransaction(contract.methods.registerPig,[pigId, merkleroot, ipfs_cid]);
        logger.info(`Transaction successful with hash: ${receipt.transactionHash}`);

        const insertQuery = `INSERT INTO pig_profiles (pig_id, birth_date, sold_at, breed, genetic_lineage, birth_weight, ear_tag, sex, status, farm_id, salt1, salt2, salt3, salt4, salt5, salt6, salt7, salt8, salt9, salt10) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`;
        const insertValues = [pigId, birthDate, soldAt, breed, geneticLineage, birthWeight, earTag, sex, status, farmId , ...salts];
        await pool.query(insertQuery, insertValues);
        
        const insertQr = `INSERT INTO qr_codes (qr_id, pig_id, qr_code_data) VALUES ($1, $2, $3)`;
        const insertQrValues = [qrId ,pigId, qrCodeBase64];
        await pool.query(insertQr, insertQrValues);

        res.send("Data added");
        logger.info(`CID: ${ipfs_cid}, Merkle Root: ${merkleroot}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        res.status(500).send("Error adding data");
    }
});


app.post('/api/vaccination', async function(req,res)
{
    try {
        const { vaccinationId, pigId, vaccineName, batchNumber, administeredBy, adminDate, nextDueDate } = req.body;
        logger.info("Calculating Merkle");

        const saltedHashes = [vaccinationId, pigId, vaccineName, batchNumber, administeredBy, adminDate, nextDueDate ].map(hashWithSalt);
        const salts = saltedHashes.map(hash => hash.salt);
        const leaves = saltedHashes.map(hash => hash.hash);

        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const merkleroot = "0x" + tree.getRoot().toString("hex");

        const ipfsData = { vaccinationId, pigId, vaccineName, batchNumber, administeredBy, adminDate, nextDueDate };
        const ipfs_cid = await uploadToIPFS(ipfsData);
        logger.info("Data added to IPFS");

        
        const receipt = await sendBlockchainTransaction(contract.methods.addVaccination,[pigId, merkleroot, ipfs_cid]);
        logger.info(`Transaction successful with hash: ${receipt.transactionHash}`);

        const insertQuery = `INSERT INTO vaccination_logs (vaccination_id, pig_id, vaccine_name, batch_number, administered_by, admin_date, next_due_date, vsalt1, vsalt2, vsalt3, vsalt4, vsalt5, vsalt6, vsalt7) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9, $10, $11, $12, $13, $14)`;
        const insertValues = [vaccinationId, pigId, vaccineName, batchNumber, administeredBy, adminDate, nextDueDate , ...salts];
        await pool.query(insertQuery, insertValues);

        res.send("Data added");
        logger.info(`CID: ${ipfs_cid}, Merkle Root: ${merkleroot}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        res.status(500).send("Error adding data");
    }
});


app.post('/api/sales', async function(req,res)
{
    try {
        const { saleId, pigId, saleDate, finalWeight, buyerName, buyerContact, price } = req.body;
        logger.info("Calculating Merkle");

        const saltedHashes = [saleId, pigId, saleDate, finalWeight, buyerName, buyerContact, price ].map(hashWithSalt);
        const salts = saltedHashes.map(hash => hash.salt);
        const leaves = saltedHashes.map(hash => hash.hash);

        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const merkleroot = "0x" + tree.getRoot().toString("hex");

        const ipfsData = { saleId, pigId, saleDate, finalWeight, buyerName, buyerContact, price };
        const ipfs_cid = await uploadToIPFS(ipfsData);
        logger.info("Data added to IPFS");

        
        const receipt = await sendBlockchainTransaction(contract.methods.recordSale,[pigId, merkleroot, ipfs_cid]);
        logger.info(`Transaction successful with hash: ${receipt.transactionHash}`);

        const insertQuery = `INSERT INTO sales (sale_id, pig_id, sale_date, final_weight, buyer_name, buyer_contact, price, ssalt1, ssalt2, ssalt3, ssalt4, ssalt5, ssalt6, ssalt7) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9, $10, $11, $12, $13, $14)`;
        const insertValues = [saleId, pigId, saleDate, finalWeight, buyerName, buyerContact, price , ...salts];
        await pool.query(insertQuery, insertValues);

        res.send("Data added");
        logger.info(`CID: ${ipfs_cid}, Merkle Root: ${merkleroot}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        res.status(500).send("Error adding data");
    }
});


app.post("/api/verify", async function(req,res)
{
  const {qrCode} = req.body;
  try
  {
    logger.info("Please wait while we verify your product...")
    const decodedPigId = Buffer.from(qrCode, 'base64').toString();
    const data = await contract.methods.getPigData(decodedPigId).call();
        
        if (!data || data.length === 0)
        {
            return res.status(404).json({ message: 'Product not found' });
        }

    const pig_block_merkle = data[1]; 
    const pig_p_cid = data[2];

    const query = `SELECT * FROM pig_profiles WHERE pig_id = $1`;
    const result = await pool.query(query, [decodedPigId]);

    if (result.rows.length === 0) {
        logger.warn("Product not found in database");
        return res.status(404).json({ message: 'Product not found in database' });
    }
    
    const { salt1, salt2, salt3, salt4, salt5, salt6, salt7, salt8, salt9, salt10 } = result.rows[0];
    const url = `https://gateway.pinata.cloud/ipfs/${pig_p_cid}`;
    const response = await axios.get(url);
    const jsonData = response.data;

    const leaves = [decodedPigId, jsonData.birthDate, jsonData.soldAt, jsonData.breed, jsonData.geneticLineage, jsonData.birthWeight, jsonData.earTag, jsonData.sex, jsonData.status, jsonData.farmId]
        .map((value, index) => keccak256([salt1, salt2, salt3, salt4, salt5, salt6, salt7, salt8, salt9, salt10][index] + value).toString('hex'));

    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const verifyPigMerkleRoot = "0x" + tree.getRoot().toString("hex");

    logger.info(`Blockchain Merkle Root: ${pig_block_merkle}, Calculated Merkle Root: ${verifyPigMerkleRoot}`);
    const isPigValid = (pig_block_merkle === verifyPigMerkleRoot);
   //###################################################################################################################################################

    const vaccination_data = await contract.methods.getVaccinationData(decodedPigId).call();
    const vaccine_block_merkle = vaccination_data[1];
    const vaccine_cid = vaccination_data[2];

    const query1 = `SELECT * FROM vaccination_logs WHERE pig_id = $1`;
    const result1 = await pool.query(query1, [decodedPigId]);

    if (result1.rows.length === 0) {
        logger.warn("Product not found in database");
        return res.status(404).json({ message: 'Product not found in database' });
    }
    
    const { vsalt1, vsalt2, vsalt3, vsalt4, vsalt5, vsalt6, vsalt7 } = result1.rows[0];
    const vurl = `https://gateway.pinata.cloud/ipfs/${vaccine_cid}`;
    const vresponse = await axios.get(vurl);
    const vjsonData = vresponse.data;

    const vleaves = [vjsonData.vaccinationId, vjsonData.pigId, vjsonData.vaccineName, vjsonData.batchNumber, vjsonData.administeredBy, vjsonData.adminDate, vjsonData.nextDueDate]
        .map((value, index) => keccak256([vsalt1, vsalt2, vsalt3, vsalt4, vsalt5, vsalt6, vsalt7][index] + value).toString('hex'));

    const vtree = new MerkleTree(vleaves, keccak256, { sortPairs: true });
    const vverifyVaccineMerkleRoot = "0x" + vtree.getRoot().toString("hex");

    logger.info(`Blockchain Merkle Root: ${vaccine_block_merkle}, Calculated Merkle Root: ${vverifyVaccineMerkleRoot}`);
    const isVaccineValid = (vaccine_block_merkle === vverifyVaccineMerkleRoot);
	//###########################################################################################################################################################

	const sales_data = await contract.methods.getSalesData(decodedPigId).call();
    const sales_block_merkle = sales_data[1];
    const sales_cid = sales_data[2];

    const query2 = `SELECT * FROM sales WHERE pig_id = $1`;
    const result2 = await pool.query(query2, [decodedPigId]);

    if (result2.rows.length === 0) {
        logger.warn("Product not found in database");
        return res.status(404).json({ message: 'Product not found in database' });
    }
    
    const { ssalt1, ssalt2, ssalt3, ssalt4, ssalt5, ssalt6, ssalt7 } = result2.rows[0];
    const surl = `https://gateway.pinata.cloud/ipfs/${sales_cid}`;
    const sresponse = await axios.get(surl);
    const sjsonData = sresponse.data;

    const sleaves = [sjsonData.saleId, decodedPigId, sjsonData.saleDate, sjsonData.finalWeight, sjsonData.buyerName, sjsonData.buyerContact, sjsonData.price]
        .map((value, index) => keccak256([ssalt1, ssalt2, ssalt3, ssalt4, ssalt5, ssalt6, ssalt7][index] + value).toString('hex'));

    const stree = new MerkleTree(sleaves, keccak256, { sortPairs: true });
    const sverifySalesMerkleRoot = "0x" + stree.getRoot().toString("hex");

    logger.info(`Blockchain Merkle Root: ${sales_block_merkle}, Calculated Merkle Root: ${sverifySalesMerkleRoot}`);
    const isSaleValid = (sales_block_merkle === sverifySalesMerkleRoot);
    
    if (isPigValid && isVaccineValid && isSaleValid) {
        logger.info("Product Verified: Authentic");
        return res.json({ message: "Product is Authentic", status: "Verified" });
    } else {
        logger.warn("Product Verification Failed: Data Tampered");
        return res.json({ message: "Product data is tampered", status: "Tampered" });
    }
  }
catch (error)
{
  logger.error(`Error: ${error.message}`);
        res.status(500).send("Error verifying data");
}
});



app.use((err, req, res, next) => {
    logger.error(`Server error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});