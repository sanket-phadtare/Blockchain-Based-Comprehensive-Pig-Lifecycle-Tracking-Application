// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract piglifecycle {
    struct PigData {
        uint256 pig_id;
        bytes32 pig_hash;
        string ipfs_cid;
    }

    struct VaccinationData {
        uint256 pig_id;
        bytes32 vaccine_hash;
        string ipfs_cid;
    }

    struct SalesData {
        uint256 pig_id;
        bytes32 sales_hash;
        string ipfs_cid;
    }

    struct QRData {
        uint256 pig_id;
        bytes32 qr_hash;
        string ipfs_cid;
    }

    mapping(uint256 => PigData) public pigData;
    mapping(uint256 => VaccinationData) public vaccinationData;
    mapping(uint256 => SalesData) public salesData;
    mapping(uint256 => QRData) public qrData;

    address public owner;

    event PigRegistered(uint256 pig_id, bytes32 pig_hash, string ipfs_cid);
    event VaccinationAdded(uint256 pig_id, bytes32 vaccine_hash, string ipfs_cid);
    event SaleRecorded(uint256 pig_id, bytes32 sales_hash, string ipfs_cid);
    event QRCodeGenerated(uint256 pig_id, bytes32 qr_hash, string ipfs_cid);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only owner can call this function");
        _;
    }


    function registerPig(uint256 pig_id, bytes32 pig_hash, string memory ipfs_cid) public {
        require(pigData[pig_id].pig_id == 0, "Pig already registered");
        pigData[pig_id] = PigData(pig_id, pig_hash, ipfs_cid);
        emit PigRegistered(pig_id, pig_hash, ipfs_cid);
    }

    function addVaccination(uint256 pig_id, bytes32 vaccine_hash, string memory ipfs_cid) public {
        require(vaccinationData[pig_id].pig_id == 0, "Vaccination already added");
        vaccinationData[pig_id] = VaccinationData(pig_id, vaccine_hash, ipfs_cid);
        emit VaccinationAdded(pig_id, vaccine_hash, ipfs_cid);
    }

    function recordSale(uint256 pig_id, bytes32 sales_hash, string memory ipfs_cid) public {
        require(salesData[pig_id].pig_id == 0, "Sale already recorded");
        salesData[pig_id] = SalesData(pig_id, sales_hash, ipfs_cid);
        emit SaleRecorded(pig_id, sales_hash, ipfs_cid);
    }

    function generateQRCode(uint256 pig_id, bytes32 qr_hash, string memory ipfs_cid) public {
        require(qrData[pig_id].pig_id == 0, "QR code already generated");
        qrData[pig_id] = QRData(pig_id, qr_hash, ipfs_cid);
        emit QRCodeGenerated(pig_id, qr_hash, ipfs_cid);
    }

    function getPigData(uint256 pigg_id) external view returns(uint256, bytes32, string memory)
    {
        require(pigData[pigg_id].pig_id !=0, "Pig Id does not exist");
        return (pigData[pigg_id].pig_id, pigData[pigg_id].pig_hash, pigData[pigg_id].ipfs_cid);
    }

    function getVaccinationData(uint256 pigg_id) external view returns(uint256, bytes32, string memory)
    {
        require(vaccinationData[pigg_id].pig_id !=0, "Pig Id does not exist");
        return(vaccinationData[pigg_id].pig_id, vaccinationData[pigg_id].vaccine_hash, vaccinationData[pigg_id].ipfs_cid);
    }

    function getSalesData(uint256 pigg_id) external view returns(uint256, bytes32, string memory)
    {
        require(salesData[pigg_id].pig_id !=0, "Pig ID does not eixts");
        return(salesData[pigg_id].pig_id, salesData[pigg_id].sales_hash, salesData[pigg_id].ipfs_cid);
    }

    function getQRData(uint256 pigg_id) external view returns(uint256, bytes32, string memory)
    {
        require(qrData[pigg_id].pig_id !=0, "Pig ID does not exist");
        return(qrData[pigg_id].pig_id, qrData[pigg_id].qr_hash, qrData[pigg_id].ipfs_cid);
    }
}