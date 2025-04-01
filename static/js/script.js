document.addEventListener('DOMContentLoaded', () => {
    // Timer elements
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const timeInput = document.getElementById('timeInput');
    const timeBlocksContainer = document.getElementById('timeBlocks');
    
    // Todo elements
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');
    
    // Points elements
    const totalPointsDisplay = document.getElementById('totalPoints');
    const timerPointsDisplay = document.getElementById('timerPoints');
    const todoPointsDisplay = document.getElementById('todoPoints');
    
    // Grid containers
    const timerContainer = document.getElementById('timerContainer');
    const todoContainer = document.getElementById('todoContainer');
    const pointsContainer = document.getElementById('pointsContainer');
    
    // Level system elements
    const currentLevelDisplay = document.getElementById('currentLevel');
    const levelProgressBar = document.getElementById('levelProgress');
    const currentPointsDisplay = document.getElementById('currentPoints');
    const nextLevelPointsDisplay = document.getElementById('nextLevelPoints');
    
    // See more elements
    const seeMoreBtn = document.createElement('div');
    seeMoreBtn.className = 'see-more';
    seeMoreBtn.textContent = 'See More';
    todoList.parentNode.appendChild(seeMoreBtn);
    
    // State variables
    let countdown;
    let timeLeft;
    let isRunning = false;
    let isPaused = false;
    let timerPoints = 0;
    let todoPoints = 0;
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    // Dragging functionality for grid items
    const gridItems = [timerContainer, todoContainer, pointsContainer];
    gridItems.forEach(item => {
        item.addEventListener('mousedown', dragStart);
        item.addEventListener('touchstart', dragStart);
    });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let activeItem = null;

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === e.currentTarget || e.target.parentNode === e.currentTarget) {
            isDragging = true;
            activeItem = e.currentTarget;
            activeItem.classList.add('dragging');
        }
    }

    function drag(e) {
        if (isDragging && activeItem) {
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            activeItem.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd() {
        if (activeItem) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            activeItem.classList.remove('dragging');
            activeItem = null;
        }
    }

    // Todo functionality
    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false
            };
            todos.push(todo);
            saveTodos();
            renderTodos();
            todoInput.value = '';
        }
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            if (todo.completed) {
                todoPoints++;
                updatePoints();
            }
            saveTodos();
            renderTodos();
        }
    }

    function deleteTodo(id) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            todoItem.draggable = true;
            todoItem.dataset.id = todo.id;
            todoItem.innerHTML = `
                <div class="drag-handle">⋮⋮</div>
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                <button class="btn delete-btn" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;">×</button>
            `;
            
            const checkbox = todoItem.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => toggleTodo(todo.id));
            
            const deleteBtn = todoItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

            // Add drag and drop event listeners
            todoItem.addEventListener('dragstart', handleDragStart);
            todoItem.addEventListener('dragend', handleDragEnd);
            todoItem.addEventListener('dragover', handleDragOver);
            todoItem.addEventListener('drop', handleDrop);
            
            todoList.appendChild(todoItem);
        });
    }

    // Drag and drop functionality for todo items
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDrop(e) {
        e.preventDefault();
        if (draggedItem !== this) {
            const allItems = [...todoList.querySelectorAll('.todo-item')];
            const draggedIndex = allItems.indexOf(draggedItem);
            const droppedIndex = allItems.indexOf(this);

            // Reorder todos array
            const [movedTodo] = todos.splice(draggedIndex, 1);
            todos.splice(droppedIndex, 0, movedTodo);
            
            // Save and re-render
            saveTodos();
            renderTodos();
        }
        return false;
    }

    // Level system variables
    let currentLevel = 1;
    let totalPoints = 0;
    let pointsForNextLevel = 100;
    
    // Calculate points needed for next level using progressive formula
    function calculateNextLevelPoints(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }
    
    // Update level and progress
    function updateLevel() {
        const nextLevelPoints = calculateNextLevelPoints(currentLevel);
        const currentLevelPoints = totalPoints - (currentLevel > 1 ? calculateNextLevelPoints(currentLevel - 1) : 0);
        const progress = (currentLevelPoints / nextLevelPoints) * 100;
        
        currentLevelDisplay.textContent = currentLevel;
        levelProgressBar.style.width = `${progress}%`;
        currentPointsDisplay.textContent = currentLevelPoints;
        nextLevelPointsDisplay.textContent = nextLevelPoints;
        
        // Check for level up
        if (currentLevelPoints >= nextLevelPoints) {
            currentLevel++;
            // Optional: Add level up animation or notification here
        }
    }
    
    // Update points and level
    function updatePoints() {
        totalPoints = timerPoints + todoPoints;
        totalPointsDisplay.textContent = totalPoints;
        timerPointsDisplay.textContent = timerPoints;
        todoPointsDisplay.textContent = todoPoints;
        updateLevel();
    }

    // Timer functionality
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft === 0) {
            timerDisplay.classList.add('flash');
        } else {
            timerDisplay.classList.remove('flash');
        }
    }

    function startTimer() {
        if (isRunning) return;
        
        const minutes = parseInt(timeInput.value) || 0;
        if (minutes <= 0) return;
        
        timeLeft = minutes * 60;
        isRunning = true;
        isPaused = false;
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        pauseBtn.disabled = false;
        timeInput.disabled = true;
        
        countdown = setInterval(() => {
            if (!isPaused) {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft === 0) {
                    clearInterval(countdown);
                    isRunning = false;
                    startBtn.disabled = false;
                    stopBtn.disabled = false;
                    pauseBtn.disabled = true;
                    timeInput.disabled = false;
                    // Award points based on timer duration
                    timerPoints += minutes;
                    updatePoints();
                }
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    }

    function stopTimer() {
        if (!isRunning && timeLeft > 0) return;
        
        clearInterval(countdown);
        isRunning = false;
        isPaused = false;
        timeLeft = 0;
        updateTimerDisplay();
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        pauseBtn.disabled = true;
        timeInput.disabled = false;
        timerDisplay.classList.remove('flash');
    }

    // Event listeners
    timeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isRunning) {
            startTimer();
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    addTodoBtn.addEventListener('click', addTodo);
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    pauseBtn.addEventListener('click', pauseTimer);

    // Handle see more functionality
    function checkTodoListHeight() {
        const todoListHeight = todoList.scrollHeight;
        const maxHeight = 400; // Matches CSS max-height
        
        if (todoListHeight > maxHeight) {
            todoList.style.maxHeight = `${maxHeight}px`;
            seeMoreBtn.classList.add('visible');
        } else {
            todoList.style.maxHeight = 'none';
            seeMoreBtn.classList.remove('visible');
        }
    }
    
    // Toggle see more
    seeMoreBtn.addEventListener('click', () => {
        if (todoList.style.maxHeight) {
            todoList.style.maxHeight = 'none';
            seeMoreBtn.textContent = 'Show Less';
        } else {
            todoList.style.maxHeight = '400px';
            seeMoreBtn.textContent = 'See More';
        }
    });
    
    // Update todo list rendering to check height
    const originalRenderTodos = renderTodos;
    renderTodos = function() {
        originalRenderTodos();
        checkTodoListHeight();
    };
    
    // Remove dragging functionality
    gridItems.forEach(item => {
        item.style.cursor = 'default';
    });
    
    // Initial setup
    renderTodos();
    updatePoints();
    checkTodoListHeight();
}); 