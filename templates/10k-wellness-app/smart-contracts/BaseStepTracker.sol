// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BaseStepTracker
 * @dev Step tracking contract optimized for Base Chain
 * Features low gas costs and batch operations
 */
contract BaseStepTracker is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;
    
    struct UserStats {
        uint256 totalSteps;
        uint256 currentStreak;
        uint256 lastGoalDate;
        uint256 totalGoalsCompleted;
        bool hasCompletedToday;
        uint256 personalGoal;
    }
    
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public dailySteps; // Track daily step history
    
    // Reward configuration
    uint256 public constant BASE_REWARD = 10 * 10**18; // 10 tokens
    uint256 public constant STREAK_BONUS = 5 * 10**18; // 5 extra tokens per week of streak
    uint256 public constant MAX_DAILY_REWARD = 100 * 10**18; // Cap daily rewards
    
    // Events
    event GoalCompleted(address indexed user, uint256 steps, uint256 goal, uint256 reward);
    event StreakUpdated(address indexed user, uint256 newStreak);
    event PersonalGoalSet(address indexed user, uint256 newGoal);
    event BatchGoalsRecorded(address[] users, uint256[] rewards);
    
    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }
    
    /**
     * @dev Set personal daily step goal
     * @param _goal Step goal (1000-50000 range for accessibility)
     */
    function setPersonalGoal(uint256 _goal) external {
        require(_goal >= 1000 && _goal <= 50000, "Goal must be between 1K-50K steps");
        userStats[msg.sender].personalGoal = _goal;
        emit PersonalGoalSet(msg.sender, _goal);
    }
    
    /**
     * @dev Record daily goal completion with gas optimization
     * @param _steps Steps taken today
     */
    function recordDailyGoal(uint256 _steps) external nonReentrant {
        UserStats storage stats = userStats[msg.sender];
        uint256 goal = stats.personalGoal > 0 ? stats.personalGoal : 10000; // Default 10K
        
        require(_steps >= goal, "Goal not reached");
        require(!stats.hasCompletedToday, "Already completed today");
        require(block.timestamp > stats.lastGoalDate + 20 hours, "Too soon since last goal");
        
        // Update streak logic
        bool isConsecutive = (block.timestamp - stats.lastGoalDate) <= 28 hours; // Allow 4hr buffer
        
        if (isConsecutive && stats.lastGoalDate > 0) {
            stats.currentStreak++;
        } else {
            stats.currentStreak = 1;
        }
        
        // Update stats
        stats.totalSteps += _steps;
        stats.lastGoalDate = block.timestamp;
        stats.totalGoalsCompleted++;
        stats.hasCompletedToday = true;
        
        // Store daily steps for analytics
        dailySteps[msg.sender].push(_steps);
        
        // Calculate reward with streak bonus
        uint256 reward = calculateReward(stats.currentStreak, _steps, goal);
        
        // Transfer reward tokens
        if (reward > 0 && rewardToken.balanceOf(address(this)) >= reward) {
            require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        }
        
        emit GoalCompleted(msg.sender, _steps, goal, reward);
        emit StreakUpdated(msg.sender, stats.currentStreak);
    }
    
    /**
     * @dev Calculate reward based on streak and performance
     * @param streak Current streak count
     * @param steps Steps taken
     * @param goal Personal goal
     * @return reward Token reward amount
     */
    function calculateReward(uint256 streak, uint256 steps, uint256 goal) 
        public 
        pure 
        returns (uint256 reward) 
    {
        reward = BASE_REWARD;
        
        // Streak bonus (5 tokens per week of streak)
        if (streak >= 7) {
            uint256 weeklyStreaks = streak / 7;
            reward += weeklyStreaks * STREAK_BONUS;
        }
        
        // Performance bonus for exceeding goal
        if (steps > goal) {
            uint256 overPerformance = ((steps - goal) * 100) / goal; // Percentage over goal
            if (overPerformance >= 50) { // 50% over goal
                reward += BASE_REWARD / 2; // 50% bonus
            } else if (overPerformance >= 25) { // 25% over goal
                reward += BASE_REWARD / 4; // 25% bonus
            }
        }
        
        // Cap maximum daily reward
        if (reward > MAX_DAILY_REWARD) {
            reward = MAX_DAILY_REWARD;
        }
    }
    
    /**
     * @dev Batch record goals for multiple users (gas efficient)
     * @param users Array of user addresses
     * @param steps Array of step counts
     */
    function batchRecordGoals(address[] calldata users, uint256[] calldata steps) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(users.length == steps.length, "Array length mismatch");
        require(users.length <= 50, "Batch too large"); // Gas limit protection
        
        uint256[] memory rewards = new uint256[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            UserStats storage stats = userStats[users[i]];
            uint256 goal = stats.personalGoal > 0 ? stats.personalGoal : 10000;
            
            if (steps[i] >= goal && !stats.hasCompletedToday) {
                // Update streak
                bool isConsecutive = (block.timestamp - stats.lastGoalDate) <= 28 hours;
                if (isConsecutive && stats.lastGoalDate > 0) {
                    stats.currentStreak++;
                } else {
                    stats.currentStreak = 1;
                }
                
                // Update stats
                stats.totalSteps += steps[i];
                stats.lastGoalDate = block.timestamp;
                stats.totalGoalsCompleted++;
                stats.hasCompletedToday = true;
                
                // Calculate and store reward
                rewards[i] = calculateReward(stats.currentStreak, steps[i], goal);
                
                // Transfer reward
                if (rewards[i] > 0 && rewardToken.balanceOf(address(this)) >= rewards[i]) {
                    rewardToken.transfer(users[i], rewards[i]);
                }
            }
        }
        
        emit BatchGoalsRecorded(users, rewards);
    }
    
    /**
     * @dev Reset daily completion status (called by automation)
     */
    function resetDailyStatus(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            userStats[users[i]].hasCompletedToday = false;
        }
    }
    
    /**
     * @dev Get user statistics
     * @param user User address
     * @return User stats struct
     */
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }
    
    /**
     * @dev Get user's daily step history
     * @param user User address
     * @return Array of daily step counts
     */
    function getDailyStepsHistory(address user) external view returns (uint256[] memory) {
        return dailySteps[user];
    }
    
    /**
     * @dev Emergency withdraw tokens (owner only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(rewardToken.transfer(owner(), amount), "Withdrawal failed");
    }
    
    /**
     * @dev Add reward tokens to contract
     * @param amount Amount to add
     */
    function addRewardTokens(uint256 amount) external onlyOwner {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
}