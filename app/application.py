from flask import Flask, render_template, request, url_for, jsonify, session
from flask_jsglue import JSGlue
from flask_socketio import SocketIO, emit, send


app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_key!'
JSGlue(app)
socketio = SocketIO(app)
user_number = 0

@app.route("/")
def main():
    return render_template("index.html")


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



@socketio.on('shoot_event')
def shoot(message):
    print(message['x'])
    print(message['y'])
    emit('shoot_response', {'data': message}, broadcast=True, include_self=False)
