from flask import Flask, render_template, request, url_for, jsonify, session, redirect
from flask_jsglue import JSGlue
from flask_socketio import SocketIO, emit, send, join_room, leave_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_key!'
JSGlue(app)
socketio = SocketIO(app)
user_number = 0
room_number = 0
rooms = []

@app.route("/")
def main():
    return render_template("fake_rooms.html", rooms=rooms)

@app.route("/create_room", methods=['POST'])
def create_room():
    room = {"name": request.form.get('room_name')}
    if len(rooms) < 2:
        rooms.append(room)
        return redirect(url_for('game', room=request.form.get('room_name')))
    else:
        return jsonify({"message": "sorry, too many rooms"})

@app.route("/game/<room>")
def game(room):
    return render_template("index.html", room=room)

@socketio.on('connect')
def test_connect():
    global user_number
    user_number = user_number + 1
    session['my_number'] = user_number
    print(f"user number {session['my_number']} connected!")
    emit('my_response', {'user_number': session['my_number'] })

@socketio.on('disconnect')
def test_disconnect():
    global user_number
    print(f"user number {session['my_number']} disconnected!")
    user_number = user_number - 1
    print(f"current number of connections: {user_number}")

@socketio.on('join_request')
def join_request(room):
    join_room(room)
    print(f"user {request.sid} requested to join {room}")


@socketio.on('shoot_event')
def shoot(message):
    print(message)
    room = message['room']
    emit('shoot_response', {'data': message}, broadcast=True, include_self=False, room=room)
