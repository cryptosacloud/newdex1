// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeManager is Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable usdtToken;
    address public stakingContract;
    
    uint256 public constant FEE_AMOUNT = 3 * 10**6; // $3 USDT (6 decimals)
    
    event FeeCollected(address indexed user, uint256 amount, string operation);
    
    constructor(address _usdtToken) {
        usdtToken = IERC20(_usdtToken);
    }
    
    modifier collectFee(string memory operation) {
        _collectFee(operation);
        _;
    }
    
    function _collectFee(string memory operation) internal {
        require(stakingContract != address(0), "Staking contract not set");
        
        // Check user has enough USDT balance
        require(
            usdtToken.balanceOf(msg.sender) >= FEE_AMOUNT,
            "Insufficient USDT balance for fee"
        );
        
        // Check user has approved enough USDT
        require(
            usdtToken.allowance(msg.sender, address(this)) >= FEE_AMOUNT,
            "Insufficient USDT allowance for fee"
        );
        
        // Transfer fee to this contract
        usdtToken.safeTransferFrom(msg.sender, address(this), FEE_AMOUNT);
        
        // Approve staking contract to collect the fee
        usdtToken.safeApprove(stakingContract, FEE_AMOUNT);
        
        // Call staking contract to collect fee
        (bool success,) = stakingContract.call(abi.encodeWithSignature("collectFee()"));
        require(success, "Fee collection failed");
        
        emit FeeCollected(msg.sender, FEE_AMOUNT, operation);
    }
    
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }
    
    function getFeeAmount() external pure returns (uint256) {
        return FEE_AMOUNT;
    }
    
    function checkFeeRequirements(address user) external view returns (
        bool hasBalance,
        bool hasAllowance,
        uint256 balance,
        uint256 allowance
    ) {
        balance = usdtToken.balanceOf(user);
        allowance = usdtToken.allowance(user, address(this));
        hasBalance = balance >= FEE_AMOUNT;
        hasAllowance = allowance >= FEE_AMOUNT;
    }
}