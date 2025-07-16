// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }
    
    function name() public view returns (string memory) { return _name; }
    function symbol() public view returns (string memory) { return _symbol; }
    function decimals() public pure returns (uint8) { return 18; }
    function totalSupply() public view returns (uint256) { return _totalSupply; }
    function balanceOf(address account) public view returns (uint256) { return _balances[account]; }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        return true;
    }
    
    function _mint(address to, uint256 amount) internal {
        _totalSupply += amount;
        _balances[to] += amount;
    }
    
    function _burn(address from, uint256 amount) internal {
        require(_balances[from] >= amount, "ERC20: burn amount exceeds balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
    }
}

contract DexBridgeCore {
    address public owner;
    address public stakingContract;
    address public immutable usdtToken;
    
    uint256 public constant FEE_AMOUNT = 3 * 10**6; // $3 USDT (6 decimals)
    
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
    bool public paused = false;
    
    bool private unlocked = true;
    modifier lock() {
        require(unlocked, 'DexBridge: LOCKED');
        unlocked = false;
        _;
        unlocked = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyRelayer() {
        require(relayers[msg.sender] || msg.sender == owner, "Not authorized relayer");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier collectFee(string memory operation) {
        _collectFee(operation);
        _;
    }
    
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
    event FeeCollected(address indexed user, uint256 amount, string operation);
    
    constructor(uint256 _chainId, address _feeCollector, address _usdtToken) {
        owner = msg.sender;
        currentChainId = _chainId;
        feeCollector = _feeCollector;
        usdtToken = _usdtToken;
        supportedChains[_chainId] = true;
    }
    
    function _collectFee(string memory operation) internal {
        require(stakingContract != address(0), "Staking contract not set");
        
        require(
            IERC20(usdtToken).balanceOf(msg.sender) >= FEE_AMOUNT,
            "Insufficient USDT balance for fee"
        );
        
        require(
            IERC20(usdtToken).allowance(msg.sender, address(this)) >= FEE_AMOUNT,
            "Insufficient USDT allowance for fee"
        );
        
        IERC20(usdtToken).transferFrom(msg.sender, address(this), FEE_AMOUNT);
        IERC20(usdtToken).approve(stakingContract, FEE_AMOUNT);
        
        (bool success,) = stakingContract.call(abi.encodeWithSignature("collectFee()"));
        require(success, "Fee collection failed");
        
        emit FeeCollected(msg.sender, FEE_AMOUNT, operation);
    }
    
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
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
    ) external payable lock whenNotPaused collectFee("bridge") returns (bytes32 txId) {
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
    
    function releaseTokens(bytes32 _txId) external onlyRelayer lock {
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
    ) external lock whenNotPaused collectFee("bridge") returns (bytes32 txId) {
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
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner, _amount);
    }
}

// Wrapped token contract for non-native tokens
contract DexBridgeWrappedToken is ERC20 {
    address public bridge;
    address public owner;
    
    modifier onlyBridge() {
        require(msg.sender == bridge, "Only bridge can mint/burn");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _bridge
    ) ERC20(_name, _symbol) {
        bridge = _bridge;
        owner = msg.sender;
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