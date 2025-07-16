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

contract LPFarming {
    IERC20 public immutable esrToken;
    address public rewardPool;
    address public owner;
    
    uint256 public esrPerSecond;
    uint256 public totalAllocPoint = 0;
    uint256 public startTime;
    uint256 public constant PRECISION = 1e12;
    bool public paused = false;
    
    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardTime;
        uint256 accESRPerShare;
        uint256 totalStaked;
        bool isActive;
        string name;
    }

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 stakedAt;
        uint256 pendingRewards;
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => uint256) public lpTokenToPoolId;
    mapping(address => bool) public authorizedCallers;
    
    bool private unlocked = true;
    modifier lock() {
        require(unlocked, 'LPFarming: LOCKED');
        unlocked = false;
        _;
        unlocked = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    event EmissionRateUpdated(uint256 esrPerSecond);
    
    constructor(
        address _esrToken,
        address _rewardPool,
        uint256 _esrPerSecond,
        uint256 _startTime
    ) {
        owner = msg.sender;
        esrToken = IERC20(_esrToken);
        rewardPool = _rewardPool;
        esrPerSecond = _esrPerSecond;
        startTime = _startTime;
        authorizedCallers[msg.sender] = true;
    }
    
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }
    
    function addPool(
        address _lpToken,
        uint256 _allocPoint,
        string memory _name,
        bool _withUpdate
    ) external onlyOwner {
        require(lpTokenToPoolId[_lpToken] == 0 && poolInfo.length == 0 || 
                address(poolInfo[lpTokenToPoolId[_lpToken]].lpToken) != _lpToken, 
                "Pool already exists");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardTime = block.timestamp > startTime ? block.timestamp : startTime;
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            lpToken: IERC20(_lpToken),
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accESRPerShare: 0,
            totalStaked: 0,
            isActive: true,
            name: _name
        }));
        
        lpTokenToPoolId[_lpToken] = poolInfo.length - 1;
        
        emit PoolAdded(poolInfo.length - 1, _lpToken, _allocPoint);
    }
    
    function setPool(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit PoolUpdated(_pid, _allocPoint);
    }
    
    function setPoolStatus(uint256 _pid, bool _isActive) external onlyOwner {
        require(_pid < poolInfo.length, "Invalid pool ID");
        poolInfo[_pid].isActive = _isActive;
    }
    
    function setEmissionRate(uint256 _esrPerSecond) external onlyOwner {
        massUpdatePools();
        esrPerSecond = _esrPerSecond;
        emit EmissionRateUpdated(_esrPerSecond);
    }
    
    function setAuthorizedCaller(address _caller, bool _authorized) external onlyOwner {
        authorizedCallers[_caller] = _authorized;
    }
    
    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
        return _to - _from;
    }
    
    function pendingESR(uint256 _pid, address _user) external view returns (uint256) {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accESRPerShare = pool.accESRPerShare;
        
        if (block.timestamp > pool.lastRewardTime && pool.totalStaked != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardTime, block.timestamp);
            uint256 esrReward = (multiplier * esrPerSecond * pool.allocPoint) / totalAllocPoint;
            accESRPerShare += (esrReward * PRECISION) / pool.totalStaked;
        }
        
        return (user.amount * accESRPerShare) / PRECISION - user.rewardDebt + user.pendingRewards;
    }
    
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }
    
    function updatePool(uint256 _pid) public {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        if (pool.totalStaked == 0 || pool.allocPoint == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardTime, block.timestamp);
        uint256 esrReward = (multiplier * esrPerSecond * pool.allocPoint) / totalAllocPoint;
        
        // Transfer ESR from reward pool
        esrToken.transferFrom(rewardPool, address(this), esrReward);
        
        pool.accESRPerShare += (esrReward * PRECISION) / pool.totalStaked;
        pool.lastRewardTime = block.timestamp;
    }
    
    function deposit(uint256 _pid, uint256 _amount) external lock whenNotPaused {
        require(_pid < poolInfo.length, "Invalid pool ID");
        require(poolInfo[_pid].isActive, "Pool is not active");
        require(_amount > 0, "Amount must be greater than 0");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accESRPerShare) / PRECISION - user.rewardDebt;
            if (pending > 0) {
                user.pendingRewards += pending;
            }
        } else {
            user.stakedAt = block.timestamp;
        }
        
        pool.lpToken.transferFrom(msg.sender, address(this), _amount);
        user.amount += _amount;
        pool.totalStaked += _amount;
        user.rewardDebt = (user.amount * pool.accESRPerShare) / PRECISION;
        
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    function withdraw(uint256 _pid, uint256 _amount) external lock {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accESRPerShare) / PRECISION - user.rewardDebt;
        if (pending > 0) {
            user.pendingRewards += pending;
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalStaked -= _amount;
            pool.lpToken.transfer(msg.sender, _amount);
        }
        
        user.rewardDebt = (user.amount * pool.accESRPerShare) / PRECISION;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }
    
    function harvest(uint256 _pid) external lock {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accESRPerShare) / PRECISION - user.rewardDebt + user.pendingRewards;
        
        if (pending > 0) {
            user.pendingRewards = 0;
            esrToken.transfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        
        user.rewardDebt = (user.amount * pool.accESRPerShare) / PRECISION;
    }
    
    function harvestAll() external lock {
        uint256 length = poolInfo.length;
        uint256 totalPending = 0;
        
        for (uint256 pid = 0; pid < length; ++pid) {
            PoolInfo storage pool = poolInfo[pid];
            UserInfo storage user = userInfo[pid][msg.sender];
            
            if (user.amount > 0) {
                updatePool(pid);
                
                uint256 pending = (user.amount * pool.accESRPerShare) / PRECISION - user.rewardDebt + user.pendingRewards;
                
                if (pending > 0) {
                    totalPending += pending;
                    user.pendingRewards = 0;
                    user.rewardDebt = (user.amount * pool.accESRPerShare) / PRECISION;
                    emit Harvest(msg.sender, pid, pending);
                }
            }
        }
        
        if (totalPending > 0) {
            esrToken.transfer(msg.sender, totalPending);
        }
    }
    
    function emergencyWithdraw(uint256 _pid) external lock {
        require(_pid < poolInfo.length, "Invalid pool ID");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        pool.totalStaked -= amount;
        
        pool.lpToken.transfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }
    
    function getUserInfo(uint256 _pid, address _user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 stakedAt,
        uint256 pendingRewards
    ) {
        require(_pid < poolInfo.length, "Invalid pool ID");
        UserInfo storage user = userInfo[_pid][_user];
        return (user.amount, user.rewardDebt, user.stakedAt, user.pendingRewards);
    }
    
    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 lastRewardTime,
        uint256 accESRPerShare,
        uint256 totalStaked,
        bool isActive,
        string memory name
    ) {
        require(_pid < poolInfo.length, "Invalid pool ID");
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            pool.allocPoint,
            pool.lastRewardTime,
            pool.accESRPerShare,
            pool.totalStaked,
            pool.isActive,
            pool.name
        );
    }
    
    function getAllPools() external view returns (
        address[] memory lpTokens,
        uint256[] memory allocPoints,
        uint256[] memory totalStaked,
        bool[] memory isActive,
        string[] memory names
    ) {
        uint256 length = poolInfo.length;
        lpTokens = new address[](length);
        allocPoints = new uint256[](length);
        totalStaked = new uint256[](length);
        isActive = new bool[](length);
        names = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            PoolInfo storage pool = poolInfo[i];
            lpTokens[i] = address(pool.lpToken);
            allocPoints[i] = pool.allocPoint;
            totalStaked[i] = pool.totalStaked;
            isActive[i] = pool.isActive;
            names[i] = pool.name;
        }
    }
    
    function getFarmingStats() external view returns (
        uint256 totalPools,
        uint256 _totalAllocPoint,
        uint256 _esrPerSecond,
        uint256 totalValueLocked
    ) {
        totalPools = poolInfo.length;
        _totalAllocPoint = totalAllocPoint;
        _esrPerSecond = esrPerSecond;
        
        // Calculate total value locked (simplified - would need price oracles in production)
        for (uint256 i = 0; i < poolInfo.length; i++) {
            totalValueLocked += poolInfo[i].totalStaked;
        }
    }
    
    function setRewardPool(address _rewardPool) external onlyOwner {
        rewardPool = _rewardPool;
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function emergencyTokenWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner, _amount);
    }
}