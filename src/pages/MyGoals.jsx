import { useState } from 'react';
import '../Styles/MyGoals.css';

const MyGoals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const addGoal = () => {
    if (!newGoal || !goalDescription) return;
    
    const newGoalData = {
      id: Date.now(),
      title: newGoal,
      description: goalDescription,
      deadline,
      progress: 0,
      isCompleted: false
    };

    setGoals([...goals, newGoalData]);
    setNewGoal('');
    setGoalDescription('');
    setDeadline('');
  };

  const updateProgress = (id, progress) => {
    setGoals(goals.map(goal =>
      goal.id === id ? { ...goal, progress: progress } : goal
    ));
  };

  const markAsCompleted = (id) => {
    setGoals(goals.map(goal =>
      goal.id === id ? { ...goal, isCompleted: true, progress: 100 } : goal
    ));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  return (
    <div className="my-goals-container">
      <h2>My Goals</h2>
      
      <div className="goal-input-section">
        <input 
          type="text" 
          placeholder="Enter goal title" 
          value={newGoal} 
          onChange={(e) => setNewGoal(e.target.value)} 
        />
        <textarea 
          placeholder="Goal description" 
          value={goalDescription} 
          onChange={(e) => setGoalDescription(e.target.value)} 
        />
        <input 
          type="date" 
          value={deadline} 
          onChange={(e) => setDeadline(e.target.value)} 
        />
        <button className="goal-action-button" onClick={addGoal}>Add Goal</button>
      </div>

      <div className="goal-list">
        {goals.map(goal => (
          <div key={goal.id} className={`goal-item ${goal.isCompleted ? 'completed' : ''}`}>
            <h3>{goal.title}</h3>
            <p>{goal.description}</p>
            <p><strong>Deadline:</strong> {goal.deadline}</p>

            <div className="progress-container">
              <progress value={goal.progress} max="100"></progress>
              <span>{goal.progress}%</span>
            </div>

            {!goal.isCompleted && (
              <button className="goal-action-button" onClick={() => updateProgress(goal.id, goal.progress + 10)}>Increase Progress</button>
            )}

            {!goal.isCompleted ? (
              <button className="goal-action-button" onClick={() => markAsCompleted(goal.id)}>Mark as Completed</button>
            ) : (
              <span>Completed</span>
            )}
            <button className="goal-action-button" onClick={() => deleteGoal(goal.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyGoals;
