import React, { useState } from "react";
import { Trophy, Gift } from "lucide-react";

const Rewards = () => {
  const [points, setPoints] = useState(350);
  const rewardThreshold = 500;
  const [topUsers, setTopUsers] = useState([
    { name: "John", points: 500 },
    { name: "Jack", points: 440 },
    { name: "Jason", points: 370 },
  ]);

  const claimReward = () => {
    if (points >= rewardThreshold) {
      alert("Congratulations! You've claimed your reward.");
      setPoints(points - rewardThreshold);
    } else {
      alert("You need more points to claim a reward.");
    }
  };

  return (
    <div className="min-w-[250px] w-full flex flex-col p-3"  style={{ paddingTop: '70px' }}>
      <h1 className="text-2xl font-semibold mb-2 flex items-center">
        <Trophy className="mr-2 text-yellow-500" /> Rewards
      </h1>

      {/* Progress Section */}
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-lg font-medium">Your Points: {points}</h2>
        <div className="w-full bg-gray-200 h-4 rounded overflow-hidden mt-2">
          <div className="bg-blue-700 h-full" style={{ width: `${(points / rewardThreshold) * 100}%` }}></div>
        </div>
        <button 
          onClick={claimReward} 
          className={`mt-3 px-4 py-2 rounded flex items-center ${points < rewardThreshold ? "bg-gray-400" : "bg-green-600 text-white hover:bg-green-500"}`} 
          disabled={points < rewardThreshold}
        >
          <Gift className="mr-2" /> Claim Reward
        </button>
      </div>

      {/* Leaderboard Section */}
      <div className="flex flex-col">
        <h2 className="text-lg font-medium mb-2">Leaderboard</h2>
        <ul className="space-y-2">
          {topUsers.map((user, index) => (
            <li key={index} className="flex justify-between p-2 bg-gray-100 rounded">
              <span>{user.name}</span>
              <span>{user.points} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Rewards;