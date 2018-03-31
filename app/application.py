from flask import Flask, render_template, request, url_for, jsonify
from flask_jsglue import JSGlue


app = Flask(__name__)
JSGlue(app)

@app.route("/")
def main():
    return render_template("index.html")


@app.route("/coords")
def coords():

    return jsonify(x=request.args.get('x'), y=request.args.get('y'))
