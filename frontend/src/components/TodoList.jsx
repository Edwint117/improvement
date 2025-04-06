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

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid #0D0C1D;
  border-radius: 8px;
  background: rgba(246, 248, 255, 0.1);
  color: #F6F8FF;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #248232;
  }
`;

const AddButton = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #248232;
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

const TodoListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  max-height: 400px;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(246, 248, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #248232;
    border-radius: 4px;
  }
`;

const TodoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(246, 248, 255, 0.1);
  border: 2px solid #0D0C1D;
  border-radius: 8px;
`;

const Checkbox = styled.input`
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
`;

const TodoText = styled.span`
  flex: 1;
  color: #F6F8FF;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  opacity: ${props => props.completed ? 0.6 : 1};
`;

const DeleteButton = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: #F64740;
  color: #F6F8FF;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }
`;

const ErrorMessage = styled.div`
  color: #F64740;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodos();

    // Subscribe to changes
    const subscription = supabase
      .channel('todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, 
        payload => {
          if (payload.eventType === 'INSERT') {
            setTodos(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setTodos(prev => prev.map(todo => 
              todo.id === payload.new.id ? payload.new : todo
            ));
          } else if (payload.eventType === 'DELETE') {
            setTodos(prev => prev.filter(todo => todo.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Error loading todos. Please try again.');
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ text: newTodo.trim(), completed: false }])
        .select()
        .single();

      if (error) throw error;
      setNewTodo('');
      setError(null);
    } catch (error) {
      console.error('Error adding todo:', error);
      setError('Error adding todo. Please try again.');
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;

      if (!completed) {
        // Get current points
        const { data: pointsData, error: pointsError } = await supabase
          .from('points')
          .select('*')
          .single();

        if (pointsError) throw pointsError;

        // Update points
        const newPoints = {
          total: pointsData.total + 5,
          timer: pointsData.timer,
          todo: pointsData.todo + 5
        };

        const { error: updateError } = await supabase
          .from('points')
          .update(newPoints)
          .eq('id', pointsData.id);

        if (updateError) throw updateError;
      }

      setError(null);
    } catch (error) {
      console.error('Error updating todo:', error);
      setError('Error updating todo. Please try again.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setError(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
      setError('Error deleting todo. Please try again.');
    }
  };

  return (
    <Container>
      <Title>Todo List</Title>
      <InputContainer>
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <AddButton onClick={addTodo} disabled={!newTodo.trim()}>
          Add
        </AddButton>
      </InputContainer>
      <TodoListContainer>
        {todos.map(todo => (
          <TodoItem key={todo.id}>
            <Checkbox
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
            />
            <TodoText completed={todo.completed}>{todo.text}</TodoText>
            <DeleteButton onClick={() => deleteTodo(todo.id)}>
              Delete
            </DeleteButton>
          </TodoItem>
        ))}
      </TodoListContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Container>
  );
}

export default TodoList; 