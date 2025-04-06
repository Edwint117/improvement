import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { supabase } from '../lib/supabase';

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

const PointsContainer = styled.div`
  background: rgba(246, 248, 255, 0.1);
  border: 2px solid #0D0C1D;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PointsValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #248232;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const PointsBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const PointsCategory = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(246, 248, 255, 0.05);
  border-radius: 6px;
`;

const CategoryTitle = styled.span`
  font-size: 1rem;
  color: #F6F8FF;
`;

const CategoryValue = styled.span`
  font-size: 1.2rem;
  color: #248232;
  font-weight: 600;
`;

const ProgressContainer = styled.div`
  margin-top: 1.5rem;
`;

const ProgressBar = styled.div`
  height: 1.5rem;
  background: rgba(246, 248, 255, 0.1);
  border: 2px solid #0D0C1D;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #248232, #1a5c24);
  transition: width 0.3s ease;
`;

const LevelText = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #F6F8FF;
  font-weight: 600;
`;

const ErrorMessage = styled.div`
  color: #F64740;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

function PointsSystem() {
  const [points, setPoints] = useState({
    total: 0,
    timer: 0,
    todo: 0
  });
  const [level, setLevel] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPoints();

    // Subscribe to changes
    const subscription = supabase
      .channel('points_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'points' }, 
        payload => {
          if (payload.eventType === 'UPDATE') {
            setPoints(payload.new);
            calculateLevel(payload.new.total);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setPoints(data);
        calculateLevel(data.total);
        setError(null);
      } else {
        // Initialize points if they don't exist
        const initialPoints = {
          total: 0,
          timer: 0,
          todo: 0
        };
        const { error: insertError } = await supabase
          .from('points')
          .insert([initialPoints]);
        
        if (insertError) throw insertError;
        
        setPoints(initialPoints);
        setLevel(1);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      setError('Error loading points. Please try again.');
    }
  };

  const calculateLevel = (totalPoints) => {
    const newLevel = Math.floor(totalPoints / 100) + 1;
    setLevel(newLevel);
  };

  const progressPercentage = (points.total % 100) / 100 * 100;

  return (
    <Container>
      <Title>Level {level}</Title>
      <PointsContainer>
        <PointsValue>{points.total}</PointsValue>
        <PointsBreakdown>
          <PointsCategory>
            <CategoryTitle>Timer Points</CategoryTitle>
            <CategoryValue>{points.timer}</CategoryValue>
          </PointsCategory>
          <PointsCategory>
            <CategoryTitle>Todo Points</CategoryTitle>
            <CategoryValue>{points.todo}</CategoryValue>
          </PointsCategory>
        </PointsBreakdown>
        <ProgressContainer>
          <ProgressBar>
            <ProgressFill style={{ width: `${progressPercentage}%` }} />
          </ProgressBar>
          <LevelText>Progress to Level {level + 1}</LevelText>
        </ProgressContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </PointsContainer>
    </Container>
  );
}

export default PointsSystem; 