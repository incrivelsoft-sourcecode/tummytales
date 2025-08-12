from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mom-chat-key'
app.config['UPLOAD_FOLDER'] = 'uploads'

socketio = SocketIO(app, cors_allowed_origins="*")

# Create upload folders
for folder in ['images', 'audio', 'video', 'docs']:
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], folder), exist_ok=True)

# Store users { sid: username }
users = {}

@app.route('/')
def index():
    return render_template('chat.html')

@app.route('/uploads/<folder>/<filename>')
def uploaded_file(folder, filename):
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], folder), filename)

@app.route('/upload_file', methods=['POST'])
def upload_file():
    file = request.files['file']
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[-1].lower()

    if ext in ['jpg', 'jpeg', 'png']:
        subfolder = 'images'
    elif ext in ['mp3', 'wav', 'webm']:
        subfolder = 'audio'
    elif ext in ['mp4', 'mov']:
        subfolder = 'video'
    else:
        subfolder = 'docs'

    folder_path = os.path.join(app.config['UPLOAD_FOLDER'], subfolder)
    filepath = os.path.join(folder_path, filename)
    file.save(filepath)

    return jsonify({
        'url': f'/uploads/{subfolder}/{filename}',
        'ext': ext,
        'name': filename
    })

@socketio.on('join')
def handle_join(data):
    users[request.sid] = data['username']
    emit("all_users", list(users.values()), broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    users.pop(request.sid, None)
    emit("all_users", list(users.values()), broadcast=True)

@socketio.on('message')
def handle_message(data):
    send(data, broadcast=True)

@socketio.on('seen')
def handle_seen(data):
    emit("seen", broadcast=True)

@socketio.on('typing')
def handle_typing(data):
    emit("typing", data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
