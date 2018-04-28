from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Rooms(db.Model):

    __tablename__ = "rooms"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    players_count = db.Column(db.Integer, nullable=False)

class Users(db.Model):

    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    sid = db.Column(db.String, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
