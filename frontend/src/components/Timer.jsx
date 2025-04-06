import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { supabase } from '../lib/supabase';

const flash = keyframes`
  0% { background-color: #161B33; }
  50% { background-color: #F64740; }
  100% { background-color: #161B33; }
`;

const Container = styled.div`
  background-color: #161B33;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #0D0C1D;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1.5rem;
  animation: ${props => props.isFinished ? flash : 'none'} 1s infinite;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  color: #F6F8FF;
  text-align: center;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
`;

const TimerDisplay = styled.div`
  background: rgba(246, 248, 255, 0.1);
  border: 2px solid #0D0C1D;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
`;

const Time = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.isFinished ? '#F64740' : '#248232'};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 1rem;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.primary ? '#248232' : '#F64740'};
  color: #F6F8FF;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PresetContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const PresetButton = styled.button`
  padding: 0.5rem 1rem;
  border: 2px solid #0D0C1D;
  border-radius: 6px;
  background: rgba(246, 248, 255, 0.1);
  color: #F6F8FF;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(246, 248, 255, 0.2);
  }
  
  &.active {
    background: #248232;
    border-color: #248232;
  }
`;

const CustomTimeInput = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #0D0C1D;
  border-radius: 6px;
  background: rgba(246, 248, 255, 0.1);
  color: #F6F8FF;
  text-align: center;
  font-size: 1.2rem;
  
  &:focus {
    outline: none;
    border-color: #248232;
  }
`;

const ErrorMessage = styled.div`
  color: #F64740;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const PRESET_TIMES = [5, 15, 25, 45, 60];

function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [worker, setWorker] = useState(null);
  const [currentTimerMinutes, setCurrentTimerMinutes] = useState(25);

  useEffect(() => {
    // Create a new worker when the component mounts
    const timerWorker = new Worker(new URL('../workers/timerWorker.js', import.meta.url));
    setWorker(timerWorker);

    // Handle messages from the worker
    timerWorker.onmessage = (e) => {
      const { time, isComplete } = e.data;
      setTimeLeft(time);
      
      if (isComplete) {
        setIsActive(false);
        setIsFinished(true);
        handleTimerComplete();
      }
    };

    // Cleanup worker when component unmounts
    return () => {
      timerWorker.terminate();
    };
  }, []);

  useEffect(() => {
    if (isActive && worker) {
      worker.postMessage({ 
        action: 'start', 
        duration: timeLeft 
      });
    } else if (!isActive && worker) {
      worker.postMessage({ action: 'stop' });
    }
  }, [isActive, worker]);

  useEffect(() => {
    setTimeLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (isActive) {
      setCurrentTimerMinutes(minutes);
    }
  }, [isActive, minutes]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerComplete = async () => {
    try {
      console.log('Timer completed, updating points...');
      
      // Get current points
      const { data: pointsData, error: pointsError } = await supabase
        .from('points')
        .select('*')
        .single();

      if (pointsError) {
        console.error('Error fetching points:', pointsError);
        throw pointsError;
      }

      console.log('Current points:', pointsData);

      // Calculate points based on the actual timer duration
      const pointsEarned = currentTimerMinutes;

      // Update points
      const newPoints = {
        total: pointsData.total + pointsEarned,
        timer: pointsData.timer + pointsEarned,
        todo: pointsData.todo
      };

      console.log('Updating points to:', newPoints);

      const { error: updateError } = await supabase
        .from('points')
        .update(newPoints)
        .eq('id', pointsData.id);

      if (updateError) {
        console.error('Error updating points:', updateError);
        throw updateError;
      }

      console.log('Points updated successfully');
      setError(null);
    } catch (error) {
      console.error('Error in handleTimerComplete:', error);
      setError('Error updating points. Please try again.');
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    setIsFinished(false);
  };

  const resetTimer = () => {
    setMinutes(25);
    setIsActive(false);
    setIsFinished(false);
  };

  const setPresetTime = (minutes) => {
    setMinutes(minutes);
    setIsActive(false);
    setIsFinished(false);
  };

  const setCustomTime = () => {
    const mins = parseInt(customMinutes);
    
    if (isNaN(mins) || mins <= 0) {
      setError('Please enter a valid number of minutes');
      return;
    }
    
    setMinutes(mins);
    setIsActive(false);
    setIsFinished(false);
    setError(null);
  };

  return (
    <Container isFinished={isFinished}>
      <Title>Pomodoro Timer</Title>
      <TimerDisplay>
        <Time isFinished={isFinished}>
          {formatTime(timeLeft)}
        </Time>
        
        <PresetContainer>
          {PRESET_TIMES.map((time) => (
            <PresetButton
              key={time}
              className={minutes === time ? 'active' : ''}
              onClick={() => setPresetTime(time)}
            >
              {time}m
            </PresetButton>
          ))}
        </PresetContainer>

        <CustomTimeInput>
          <Input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Minutes"
            min="1"
          />
          <Button onClick={setCustomTime}>Set</Button>
        </CustomTimeInput>

        <Controls>
          <Button 
            primary 
            onClick={toggleTimer}
            disabled={timeLeft === 0}
          >
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer}>Reset</Button>
        </Controls>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </TimerDisplay>
    </Container>
  );
}

export default Timer; 