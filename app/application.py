import os

from flask import Flask, render_template, request, url_for, jsonify, session, redirect
from flask_jsglue import JSGlue
from flask_socketio import SocketIO, emit, send, join_room, leave_room

#from sqlalchemy import create_engine
#from sqlalchemy.orm import scoped_session, sessionmaker

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

room_number = 1

@app.route("/")
def main():
    rooms = Rooms.query.all()
    print(rooms)
    return render_template("rooms.html", rooms=rooms)

@app.route("/create_room", methods=['POST'])
def create_room():
    new_room = Rooms(name=request.form.get("room_name"), players_count=0)
    db.session.add(new_room)
    db.session.commit()
    return jsonify({"name": request.form.get("room_name")})

@app.route("/game/<room>", methods=['POST'])
def game(room):
    return render_template("index.html", room=room, name=request.form.get("player_name"))


@socketio.on('disconnect')
def disconnect_request():

    user = Users.query.filter_by(sid=request.sid).first()
    room = Rooms.query.get(user.room_id)
    print(room.name)
    room.players_count -= 1
    db.session.add(room)
    db.session.delete(user)
    db.session.commit()

@socketio.on('join_request')
def join_request(room):

    join_room(room)
    room = Rooms.query.filter_by(name=room).first()
    new_user = Users(sid=request.sid, room_id=room.id)
    room.players_count += 1
    db.session.add(new_user)
    db.session.add(room)
    db.session.commit()
    print(f"user {request.sid} requested to join {room.name}")


@socketio.on('shoot_event')
def shoot(message):
    print(message)
    room = message['room']
    emit('shoot_response', {'data': message}, broadcast=True, include_self=False, room=room)
