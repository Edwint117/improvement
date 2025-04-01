from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_session import Session
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/save_time', methods=['POST'])
def save_time():
    selected_time = request.json.get('time')
    if 'time_history' not in session:
        session['time_history'] = []
    
    # Add new time to history if it's not already there
    if selected_time not in session['time_history']:
        session['time_history'].append(selected_time)
        # Keep only the last 6 times
        session['time_history'] = session['time_history'][-6:]
    
    return jsonify({
        'success': True,
        'time_history': session['time_history']
    })

@app.route('/get_last_time')
def get_last_time():
    return jsonify({
        'last_time': session.get('last_time', 0),
        'time_history': session.get('time_history', [])
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 