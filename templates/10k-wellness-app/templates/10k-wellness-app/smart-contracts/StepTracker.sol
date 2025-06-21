// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StepTracker is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;
    
    struct UserStats {
        uint256 totalSteps;
        uint256 currentStreak;
        uint256 lastGoalDate;
        uint256 totalGoalsCompleted;
        bool hasCompletedToday;
    }
    
    mapping(address => UserStats) public userStats;
    mapping(address => uint256) public dailyGoals;
    
    uint256 public constant BASE_REWARD = 10 * 10**18; // 10 tokens
    uint256 public constant STREAK_MULTIPLIER = 2;
    
    event GoalCompleted(address indexed user, uint256 steps, uint256 goal, uint256 reward);
    event StreakUpdated(address indexed user, uint256 newStreak);
    
    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }
    
    function setDailyGoal(uint256 _goal) external {
        require(_goal >= 1000 && _goal <= 50000, "Invalid goal range");
        dailyGoals[msg.sender] = _goal;
    }
    
    function recordDailyGoal(uint256 _steps, uint256 _goal) external nonReentrant {
        require(_steps >= _goal, "Goal not reached");
        require(!userStats[msg.sender].hasCompletedToday, "Already completed today");
        
        UserStats storage stats = userStats[msg.sender];
        
        // Check if this is consecutive day
        bool isConsecutive = (block.timestamp - stats.lastGoalDate) <= 86400; // 24 hours
        
        if (isConsecutive) {
            stats.currentStreak++;
        } else {
            stats.currentStreak = 1;
        }
        
        stats.totalSteps += _steps;
        stats.lastGoalDate = block.timestamp;
        stats.totalGoalsCompleted++;
        stats.hasCompletedToday = true;
        
        // Calculate reward based on streak
        uint256 reward = BASE_REWARD;
        if (stats.currentStreak >= 7) {
            reward = reward * STREAK_MULTIPLIER;
        }
        
        // Transfer reward tokens
        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        
        emit GoalCompleted(msg.sender, _steps, _goal, reward);
        emit StreakUpdated(msg.sender, stats.currentStreak);
    }
    
    function resetDailyStatus() external {
        // This would be called by a keeper/cron job daily
        userStats[msg.sender].hasCompletedToday = false;
    }
    
    function getUserStats(address _user) external view returns (UserStats memory) {
        return userStats[_user];
    }
}