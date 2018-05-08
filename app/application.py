import os

from flask import Flask, render_template, request, url_for, jsonify, session, redirect
from flask_jsglue import JSGlue
from flask_socketio import SocketIO, emit, send, join_room, leave_room

from models import *

basedir = os.path.abspath(os.path.dirname(__file__))
database = 'sqlite:///' + os.path.join(basedir, 'data.db')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = database
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super_secret_key!'
db.init_app(app)
JSGlue(app)
socketio = SocketIO(app)

@app.route("/")
def main():
    rooms = Rooms.query.all()
    return render_template("rooms.html", rooms=rooms)

@app.route("/create_room", methods=['POST'])
def create_room():
    new_room = Rooms(name=request.form.get("room_name"), players_count=0, players_ready=0, full=False)
    db.session.add(new_room)
    db.session.commit()
    return jsonify({"name": request.form.get("room_name")})

@app.route("/game/<room>", methods=['GET','POST'])
def game(room):
    if request.method == 'GET':
        return redirect(url_for('main'))
    elif request.method == 'POST':
        return render_template("index.html", room=room, name=request.form.get("player_name"))


@socketio.on('disconnect')
def disconnect_request():

    user = Users.query.filter_by(sid=request.sid).first()
    room = Rooms.query.get(user.room_id)
    print(room.name)
    room.players_count -= 1
    room.players_ready -= 1
    if room.players_ready < 0:
        room.players_ready = 0
    if room.players_count < 0:
        room.players_count = 0;
    room.full = False
    db.session.add(room)
    db.session.delete(user)
    db.session.commit()

@socketio.on('join_request')
def join_request(message):

    join_room(message['room'])
    room = Rooms.query.filter_by(name=message['room']).first()
    new_user = Users(sid=request.sid, name=message['name'], room_id=room.id)
    print(str(new_user))
    room.players_count += 1
    if room.players_count == 2:
        room.full = True
    db.session.add(new_user)
    db.session.add(room)
    db.session.commit()

    emit('join_response', {'data': message}, broadcast=True, room=message['room'])


@socketio.on('player_ready_event')
def ready(message):
    room = Rooms.query.filter_by(name=message['room']).first()
    room.players_ready += 1

    if room.players_ready == 1:
        db.session.add(room)
        db.session.commit()
        print(f"player {request.sid} is ready and will shoot first!")
        emit("player_ready_response", {"data": message}, room=request.sid)

    if room.players_ready == 2:
        print(f"game is ready!")
        db.session.add(room)
        db.session.commit()
        emit("game_ready_response", room=message["room"])



@socketio.on('shoot_event')
def shoot(message):
    room = message['room']
    emit('shoot_response', {'data': message}, broadcast=True, include_self=False, room=room)

@socketio.on('hit_event')
def hit(message):
    emit('hit_response', {'data': message}, broadcast=True, include_self=False, room=message['room'])

@socketio.on("sink_event")
def ship_sink(message):
    emit('sink_response', {'data': message}, broadcast=True, include_self=False, room=message['room'])

@socketio.on('game_over_event')
def game_over(message):
    emit('game_over_response', {'data': message}, broadcast=True, include_self=False, room=message['room'])

@socketio.on('chat_event')
def chat(message):
    room = message['room']
    emit('chat_response', {'data': message}, broadcast=True, include_self=False, room=room)
