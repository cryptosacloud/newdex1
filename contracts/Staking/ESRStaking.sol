// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ESRStaking is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaim;
        bool isActive;
    }

    struct RewardDistribution {
        uint256 totalRewards;
        uint256 distributedAt;
        uint256 totalStakedAtDistribution;
        mapping(address => bool) claimed;
    }

    IERC20 public immutable esrToken;
    IERC20 public immutable usdtToken;
    
    uint256 public constant MINIMUM_STAKE = 100 * 10**18; // 100 ESR minimum
    uint256 public constant LOCK_PERIOD = 7 days;
    
    mapping(address => StakeInfo) public stakes;
    mapping(uint256 => RewardDistribution) public rewardDistributions;
    
    address[] public stakers;
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public currentDistributionId;
    uint256 public pendingRewards;
    
    address public feeCollector;
    address public rewardPool;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 distributionId, uint256 totalRewards, uint256 totalStakers);
    event RewardsClaimed(address indexed user, uint256 distributionId, uint256 amount);
    event FeeCollected(uint256 amount);
    
    constructor(
        address _esrToken,
        address _usdtToken,
        address _feeCollector,
        address _rewardPool
    ) {
        esrToken = IERC20(_esrToken);
        usdtToken = IERC20(_usdtToken);
        feeCollector = _feeCollector;
        rewardPool = _rewardPool;
    }
    
    function stake(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount >= MINIMUM_STAKE, "Amount below minimum stake");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        if (!userStake.isActive) {
            stakers.push(msg.sender);
            userStake.isActive = true;
            userStake.stakedAt = block.timestamp;
            userStake.lastRewardClaim = currentDistributionId;
        }
        
        userStake.amount += _amount;
        totalStaked += _amount;
        
        esrToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        require(userStake.amount >= _amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.stakedAt + LOCK_PERIOD,
            "Stake is still locked"
        );
        
        userStake.amount -= _amount;
        totalStaked -= _amount;
        
        if (userStake.amount == 0) {
            userStake.isActive = false;
            // Remove from stakers array
            for (uint256 i = 0; i < stakers.length; i++) {
                if (stakers[i] == msg.sender) {
                    stakers[i] = stakers[stakers.length - 1];
                    stakers.pop();
                    break;
                }
            }
        }
        
        esrToken.safeTransfer(msg.sender, _amount);
        
        emit Unstaked(msg.sender, _amount);
    }
    
    function collectFee() external {
        require(msg.sender == feeCollector, "Only fee collector");
        
        uint256 feeAmount = 3 * 10**6; // $3 USDT (6 decimals)
        usdtToken.safeTransferFrom(msg.sender, address(this), feeAmount);
        
        pendingRewards += feeAmount;
        
        emit FeeCollected(feeAmount);
    }
    
    function distributeRewards() external onlyOwner {
        require(pendingRewards > 0, "No pending rewards");
        require(totalStaked > 0, "No stakers");
        
        currentDistributionId++;
        RewardDistribution storage distribution = rewardDistributions[currentDistributionId];
        
        distribution.totalRewards = pendingRewards;
        distribution.distributedAt = block.timestamp;
        distribution.totalStakedAtDistribution = totalStaked;
        
        totalRewardsDistributed += pendingRewards;
        pendingRewards = 0;
        
        emit RewardsDistributed(currentDistributionId, distribution.totalRewards, stakers.length);
    }
    
    function claimRewards(uint256 _distributionId) external nonReentrant {
        require(_distributionId <= currentDistributionId, "Invalid distribution ID");
        
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        require(_distributionId > userStake.lastRewardClaim, "Rewards already claimed");
        
        RewardDistribution storage distribution = rewardDistributions[_distributionId];
        require(!distribution.claimed[msg.sender], "Already claimed");
        
        uint256 userReward = (distribution.totalRewards * userStake.amount) / distribution.totalStakedAtDistribution;
        
        distribution.claimed[msg.sender] = true;
        userStake.lastRewardClaim = _distributionId;
        
        usdtToken.safeTransfer(msg.sender, userReward);
        
        emit RewardsClaimed(msg.sender, _distributionId, userReward);
    }
    
    function claimAllRewards() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        
        uint256 totalReward = 0;
        
        for (uint256 i = userStake.lastRewardClaim + 1; i <= currentDistributionId; i++) {
            RewardDistribution storage distribution = rewardDistributions[i];
            if (!distribution.claimed[msg.sender]) {
                uint256 userReward = (distribution.totalRewards * userStake.amount) / distribution.totalStakedAtDistribution;
                totalReward += userReward;
                distribution.claimed[msg.sender] = true;
            }
        }
        
        require(totalReward > 0, "No rewards to claim");
        
        userStake.lastRewardClaim = currentDistributionId;
        usdtToken.safeTransfer(msg.sender, totalReward);
        
        emit RewardsClaimed(msg.sender, currentDistributionId, totalReward);
    }
    
    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 lockEndsAt,
        bool canUnstake,
        uint256 pendingRewards
    ) {
        StakeInfo storage userStake = stakes[_user];
        amount = userStake.amount;
        stakedAt = userStake.stakedAt;
        lockEndsAt = userStake.stakedAt + LOCK_PERIOD;
        canUnstake = block.timestamp >= lockEndsAt && userStake.isActive;
        
        // Calculate pending rewards
        for (uint256 i = userStake.lastRewardClaim + 1; i <= currentDistributionId; i++) {
            RewardDistribution storage distribution = rewardDistributions[i];
            if (!distribution.claimed[_user] && userStake.isActive) {
                pendingRewards += (distribution.totalRewards * userStake.amount) / distribution.totalStakedAtDistribution;
            }
        }
    }
    
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalStakers,
        uint256 _totalRewardsDistributed,
        uint256 _pendingRewards,
        uint256 _currentAPR
    ) {
        _totalStaked = totalStaked;
        _totalStakers = stakers.length;
        _totalRewardsDistributed = totalRewardsDistributed;
        _pendingRewards = pendingRewards;
        
        // Calculate APR based on last 30 days of rewards (simplified)
        if (totalStaked > 0 && totalRewardsDistributed > 0) {
            _currentAPR = (totalRewardsDistributed * 365 * 100) / (totalStaked * 30); // Rough APR calculation
        }
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }
    
    function setRewardPool(address _rewardPool) external onlyOwner {
        rewardPool = _rewardPool;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}