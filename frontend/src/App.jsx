import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import TodoList from './components/TodoList';
import PointsSystem from './components/PointsSystem';
import Timer from './components/Timer';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #0D0C1D;
  color: #F6F8FF;
  padding: 2rem;
  display: flex;
  gap: 2rem;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ProfileSection = styled.div`
  width: 300px;
  background-color: #161B33;
  border: 2px solid #0D0C1D;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  background-color: #248232;
  border-radius: 50%;
  border: 3px solid #0D0C1D;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #F6F8FF;
`;

const ProgressContainer = styled.div`
  width: 100%;
  background-color: #0D0C1D;
  border-radius: 4px;
  padding: 0.5rem;
  position: relative;
`;

const ProgressBar = styled.div`
  height: 20px;
  background: linear-gradient(90deg, #248232, #2BA84A);
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const LevelDisplay = styled.div`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: #F6F8FF;
`;

const ActiveTimer = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: #248232;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1.2rem;
  color: #F6F8FF;
  border: 2px solid #0D0C1D;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Tab = styled.button`
  background-color: ${props => props.active ? '#248232' : '#161B33'};
  color: #F6F8FF;
  border: 2px solid #0D0C1D;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;

  &:hover {
    background-color: ${props => props.active ? '#248232' : '#1E2547'};
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [activeTimer, setActiveTimer] = useState(null);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const xpToNextLevel = 1000;
  const [pointsUpdateTrigger, setPointsUpdateTrigger] = useState(0);

  useEffect(() => {
    // Calculate level based on XP
    const newLevel = Math.floor(xp / xpToNextLevel) + 1;
    setLevel(newLevel);
  }, [xp]);

  const progress = (xp % xpToNextLevel) / xpToNextLevel * 100;

  const handlePointsUpdate = () => {
    console.log('Points update triggered'); // Debug log
    setPointsUpdateTrigger(prev => prev + 1);
  };

  return (
    <AppContainer>
      <MainContent>
        <TabContainer>
          <Tab 
            active={activeTab === 'timer'} 
            onClick={() => setActiveTab('timer')}
          >
            Timer
          </Tab>
          <Tab 
            active={activeTab === 'todos'} 
            onClick={() => setActiveTab('todos')}
          >
            Todo List
          </Tab>
        </TabContainer>

        {activeTab === 'timer' && <Timer setActiveTimer={setActiveTimer} onPointsUpdate={handlePointsUpdate} />}
        {activeTab === 'todos' && <TodoList />}
      </MainContent>

      <ProfileSection>
        {activeTimer && (
          <ActiveTimer>
            {activeTimer}
          </ActiveTimer>
        )}
        <PointsSystem key={pointsUpdateTrigger} />
      </ProfileSection>
    </AppContainer>
  );
}

export default App;
