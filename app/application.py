import os

from flask import Flask, render_template, request, url_for, jsonify, session, redirect
from flask_jsglue import JSGlue
from flask_socketio import SocketIO, emit, send, join_room, leave_room

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

basedir = os.path.abspath(os.path.dirname(__file__))
database = 'sqlite:///' + os.path.join(basedir, 'data.db')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_key!'
JSGlue(app)
socketio = SocketIO(app)

engine = create_engine(database)
db = scoped_session(sessionmaker(bind=engine))

user_number = 0

@app.route("/")
def main():
    rooms = db.execute("SELECT * FROM rooms").fetchall()
    return render_template("fake_rooms.html", rooms=rooms)

@app.route("/create_room", methods=['POST'])
def create_room():
    db.execute("INSERT INTO rooms (name, connected_users) VALUES (:room, :connected_users)", {"room": request.form.get("room_name"), "connected_users": 0})
    db.commit()
    return redirect(url_for('game', room=request.form.get('room_name')))

@app.route("/game/<room>")
def game(room):
    connected_users = db.execute("SELECT connected_users FROM rooms WHERE name = :room", {"room": room}).fetchone()
    print(connected_users)
    if int(connected_users[0]) < 2:
        return render_template("index.html", room=room)
    else:
        return jsonify({"message": "this room is full!"})

@socketio.on('connect')
def test_connect():
    global user_number
    user_number = user_number + 1

@socketio.on('disconnect')
def test_disconnect():

    room = db.execute("SELECT room_name FROM users WHERE user_id = :user_id", {"user_id": request.sid}).fetchone()
    db.execute("UPDATE rooms SET connected_users = connected_users - 1 WHERE name = :room", {"room": room[0]})
    connected_users =  db.execute("SELECT connected_users FROM rooms WHERE name = :room", {"room": room[0]}).fetchone()
    if int(connected_users[0]) == 0:
        db.execute("DELETE FROM rooms WHERE name = :name", {"name": room[0]})
    db.execute("DELETE FROM users WHERE user_id = :user_id", {"user_id": request.sid})

@socketio.on('join_request')
def join_request(room):
    join_room(room)
    db.execute("INSERT INTO users (user_id, room_name) VALUES (:user_id, :room_name)", {"user_id": request.sid, "room_name": room});
    db.execute("UPDATE rooms SET connected_users = connected_users + 1 WHERE name = :room", {"room": room})
    db.commit()
    print(f"user {request.sid} requested to join {room}")


@socketio.on('shoot_event')
def shoot(message):
    print(message)
    room = message['room']
    emit('shoot_response', {'data': message}, broadcast=True, include_self=False, room=room)
