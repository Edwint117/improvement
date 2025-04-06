from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Create data directory if it doesn't exist
if not os.path.exists('data'):
    os.makedirs('data')

# Create static directory if it doesn't exist
if not os.path.exists('static'):
    os.makedirs('static')

# File paths for data storage
TODOS_FILE = 'data/todos.json'
POINTS_FILE = 'data/points.json'
TIMER_FILE = 'data/timer.json'

# Initialize data files if they don't exist
def init_data_files():
    if not os.path.exists(TODOS_FILE):
        with open(TODOS_FILE, 'w') as f:
            json.dump([], f)
    if not os.path.exists(POINTS_FILE):
        with open(POINTS_FILE, 'w') as f:
            json.dump({"total": 0, "timer": 0, "todo": 0}, f)
    if not os.path.exists(TIMER_FILE):
        with open(TIMER_FILE, 'w') as f:
            json.dump({"previousTimes": []}, f)

# Load data from file
def load_data(file_path):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Save data to file
def save_data(data, file_path):
    with open(file_path, 'w') as f:
        json.dump(data, f)

# Initialize data files
init_data_files()

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Serve favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/api/todos', methods=['GET', 'POST'])
def handle_todos():
    if request.method == 'GET':
        todos = load_data(TODOS_FILE)
        return jsonify(todos)
    elif request.method == 'POST':
        todos = load_data(TODOS_FILE)
        new_todo = request.json
        todos.append(new_todo)
        save_data(todos, TODOS_FILE)
        return jsonify(new_todo)

@app.route('/api/todos/<int:todo_id>', methods=['PUT', 'DELETE'])
def handle_todo(todo_id):
    todos = load_data(TODOS_FILE)
    if request.method == 'PUT':
        if 0 <= todo_id < len(todos):
            todos[todo_id] = request.json
            save_data(todos, TODOS_FILE)
            return jsonify(todos[todo_id])
        return jsonify({"error": "Todo not found"}), 404
    elif request.method == 'DELETE':
        if 0 <= todo_id < len(todos):
            deleted_todo = todos.pop(todo_id)
            save_data(todos, TODOS_FILE)
            return jsonify(deleted_todo)
        return jsonify({"error": "Todo not found"}), 404

@app.route('/api/points', methods=['GET', 'PUT'])
def handle_points():
    if request.method == 'GET':
        points = load_data(POINTS_FILE)
        return jsonify(points)
    elif request.method == 'PUT':
        points = request.json
        save_data(points, POINTS_FILE)
        return jsonify(points)

@app.route('/api/timer', methods=['GET', 'POST'])
def handle_timer():
    if request.method == 'GET':
        timer_data = load_data(TIMER_FILE)
        return jsonify(timer_data)
    elif request.method == 'POST':
        timer_data = load_data(TIMER_FILE)
        new_time = request.json.get('time', 0)
        if new_time not in timer_data['previousTimes']:
            timer_data['previousTimes'].append(new_time)
            save_data(timer_data, TIMER_FILE)
        return jsonify(timer_data)

if __name__ == '__main__':
    app.run(debug=True, port=5002) 