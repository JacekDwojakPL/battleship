import os
from flask import Flask
from models import *

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
database = 'sqlite:///' + os.path.join(basedir, 'data.db')

app.config['SQLALCHEMY_DATABASE_URI'] = database
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super_secret_key!'
db.init_app(app)

def main():
    db.create_all()

if __name__ == "__main__":
    with app.app_context():
        main()
