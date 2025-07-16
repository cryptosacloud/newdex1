// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../DEX/FeeManager.sol";

contract DexBridgeCore is Ownable, ReentrancyGuard, Pausable, FeeManager {
    struct BridgeToken {
        address tokenAddress;
        uint256 chainId;
        bool isNative;
        bool isActive;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee; // Fee in basis points (100 = 1%)
    }
    
    struct BridgeTransaction {
        bytes32 txId;
        address user;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 sourceChain;
        uint256 targetChain;
        address targetAddress;
        uint256 timestamp;
        BridgeStatus status;
    }
    
    enum BridgeStatus {
        Pending,
        Locked,
        Released,
        Completed,
        Failed
    }
    
    mapping(address => BridgeToken) public supportedTokens;
    mapping(bytes32 => BridgeTransaction) public bridgeTransactions;
    mapping(address => bool) public relayers;
    mapping(uint256 => bool) public supportedChains;
    
    address[] public tokenList;
    bytes32[] public transactionList;
    
    uint256 public currentChainId;
    uint256 public bridgeFee = 250; // 2.5% default fee
    address public feeCollector;
    
    event TokenLocked(
        bytes32 indexed txId,
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 targetChain,
        address targetAddress
    );
    
    event TokenReleased(
        bytes32 indexed txId,
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event TokenMinted(
        bytes32 indexed txId,
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event TokenBurned(
        bytes32 indexed txId,
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event BridgeCompleted(bytes32 indexed txId);
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    
    modifier onlyRelayer() {
        require(relayers[msg.sender] || msg.sender == owner(), "Not authorized relayer");
        _;
    }
    
    constructor(uint256 _chainId, address _feeCollector, address _usdtToken) FeeManager(_usdtToken) {
        currentChainId = _chainId;
        feeCollector = _feeCollector;
        supportedChains[_chainId] = true;
    }
    
    function addSupportedToken(
        address _token,
        uint256 _chainId,
        bool _isNative,
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _fee
    ) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_fee <= 1000, "Fee too high"); // Max 10%
        
        supportedTokens[_token] = BridgeToken({
            tokenAddress: _token,
            chainId: _chainId,
            isNative: _isNative,
            isActive: true,
            minAmount: _minAmount,
            maxAmount: _maxAmount,
            fee: _fee
        });
        
        tokenList.push(_token);
    }
    
    function addRelayer(address _relayer) external onlyOwner {
        relayers[_relayer] = true;
        emit RelayerAdded(_relayer);
    }
    
    function removeRelayer(address _relayer) external onlyOwner {
        relayers[_relayer] = false;
        emit RelayerRemoved(_relayer);
    }
    
    function addSupportedChain(uint256 _chainId) external onlyOwner {
        supportedChains[_chainId] = true;
    }
    
    function lockTokens(
        address _token,
        uint256 _amount,
        uint256 _targetChain,
        address _targetAddress
    ) external payable nonReentrant whenNotPaused collectFee("bridge") returns (bytes32 txId) {
        require(supportedTokens[_token].isActive, "Token not supported");
        require(supportedChains[_targetChain], "Target chain not supported");
        require(_targetChain != currentChainId, "Cannot bridge to same chain");
        require(_amount >= supportedTokens[_token].minAmount, "Amount below minimum");
        require(_amount <= supportedTokens[_token].maxAmount, "Amount above maximum");
        
        BridgeToken memory bridgeToken = supportedTokens[_token];
        uint256 fee = (_amount * bridgeToken.fee) / 10000;
        uint256 netAmount = _amount - fee;
        
        // Generate unique transaction ID
        txId = keccak256(abi.encodePacked(
            msg.sender,
            _token,
            _amount,
            _targetChain,
            block.timestamp,
            block.number
        ));
        
        // Transfer tokens to bridge
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        
        // Transfer fee to collector
        if (fee > 0) {
            IERC20(_token).transfer(feeCollector, fee);
        }
        
        // Store transaction
        bridgeTransactions[txId] = BridgeTransaction({
            txId: txId,
            user: msg.sender,
            token: _token,
            amount: netAmount,
            fee: fee,
            sourceChain: currentChainId,
            targetChain: _targetChain,
            targetAddress: _targetAddress,
            timestamp: block.timestamp,
            status: BridgeStatus.Locked
        });
        
        transactionList.push(txId);
        
        emit TokenLocked(txId, msg.sender, _token, netAmount, _targetChain, _targetAddress);
    }
    
    function releaseTokens(bytes32 _txId) external onlyRelayer nonReentrant {
        BridgeTransaction storage transaction = bridgeTransactions[_txId];
        require(transaction.status == BridgeStatus.Locked, "Invalid transaction status");
        require(transaction.targetChain == currentChainId, "Wrong target chain");
        
        // Check if token is native to this chain or needs minting
        BridgeToken memory bridgeToken = supportedTokens[transaction.token];
        
        if (bridgeToken.isNative) {
            // Release locked tokens
            IERC20(transaction.token).transfer(transaction.targetAddress, transaction.amount);
            emit TokenReleased(_txId, transaction.user, transaction.token, transaction.amount);
        } else {
            // Mint wrapped tokens
            DexBridgeWrappedToken(transaction.token).mint(transaction.targetAddress, transaction.amount);
            emit TokenMinted(_txId, transaction.user, transaction.token, transaction.amount);
        }
        
        transaction.status = BridgeStatus.Completed;
        emit BridgeCompleted(_txId);
    }
    
    function burnAndBridge(
        address _token,
        uint256 _amount,
        uint256 _targetChain,
        address _targetAddress
    ) external nonReentrant whenNotPaused collectFee("bridge") returns (bytes32 txId) {
        require(supportedTokens[_token].isActive, "Token not supported");
        require(!supportedTokens[_token].isNative, "Cannot burn native token");
        require(supportedChains[_targetChain], "Target chain not supported");
        require(_targetChain != currentChainId, "Cannot bridge to same chain");
        
        BridgeToken memory bridgeToken = supportedTokens[_token];
        uint256 fee = (_amount * bridgeToken.fee) / 10000;
        uint256 netAmount = _amount - fee;
        
        txId = keccak256(abi.encodePacked(
            msg.sender,
            _token,
            _amount,
            _targetChain,
            block.timestamp,
            block.number
        ));
        
        // Burn wrapped tokens
        DexBridgeWrappedToken(_token).burnFrom(msg.sender, _amount);
        
        // Store transaction
        bridgeTransactions[txId] = BridgeTransaction({
            txId: txId,
            user: msg.sender,
            token: _token,
            amount: netAmount,
            fee: fee,
            sourceChain: currentChainId,
            targetChain: _targetChain,
            targetAddress: _targetAddress,
            timestamp: block.timestamp,
            status: BridgeStatus.Pending
        });
        
        transactionList.push(txId);
        
        emit TokenBurned(txId, msg.sender, _token, netAmount);
    }
    
    function getTransaction(bytes32 _txId) external view returns (BridgeTransaction memory) {
        return bridgeTransactions[_txId];
    }
    
    function getAllTransactions() external view returns (bytes32[] memory) {
        return transactionList;
    }
    
    function getUserTransactions(address _user) external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < transactionList.length; i++) {
            if (bridgeTransactions[transactionList[i]].user == _user) {
                count++;
            }
        }
        
        bytes32[] memory userTxs = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < transactionList.length; i++) {
            if (bridgeTransactions[transactionList[i]].user == _user) {
                userTxs[index] = transactionList[i];
                index++;
            }
        }
        
        return userTxs;
    }
    
    function setBridgeFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        bridgeFee = _fee;
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }
}

// Wrapped token contract for non-native tokens
contract DexBridgeWrappedToken is ERC20, Ownable {
    address public bridge;
    
    modifier onlyBridge() {
        require(msg.sender == bridge, "Only bridge can mint/burn");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _bridge
    ) ERC20(_name, _symbol) {
        bridge = _bridge;
    }
    
    function mint(address _to, uint256 _amount) external onlyBridge {
        _mint(_to, _amount);
    }
    
    function burnFrom(address _from, uint256 _amount) external onlyBridge {
        _burn(_from, _amount);
    }
    
    function setBridge(address _bridge) external onlyOwner {
        bridge = _bridge;
    }
}