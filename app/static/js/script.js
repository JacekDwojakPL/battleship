var game_board = create_game_board();
var ships_global = {
  1: {
      ships: [],
      ships_quantity: 0,
      ships_amount: 4
      },
  2: {
      ships: [],
      ships_quantity: 0,
      ships_amount: 3
      },
  3: {
      ships: [],
      ships_quantity: 0,
      ships_amount: 2
      },
  4: {
      ships: [],
      ships_quantity: 0,
      ships_amount: 1
      }
  };

var socket = io.connect('http://' + document.domain + ':' + location.port);
var room = document.querySelector('h1').dataset.room;
var name = document.querySelector('h1').dataset.name;
var cell_counter = 0;
var sinked_ships = 0;
var game_ready = false;
var your_turn = false;

document.addEventListener('DOMContentLoaded', () => {
  var game_div1 = document.querySelector('.game_div1');
  var game_div2 = document.querySelector('.game_div2');
  var chat_button = document.querySelector('.chat_button');
  var start_button = document.querySelector('.start_button');

  var player_class = "player";
  var opponent_class = "opponent";

  var player_board = render_game_board(game_div1, player_class);
  var opponent_board = render_game_board(game_div2, opponent_class);

  var join_message = {name: name, room: room}

  /*** HANDLE JOIN ROOM EVENT AND RESPONSE ***/
  socket.emit('join_request', join_message);

  socket.on('join_response', function(data) {
    var game_log = document.querySelector('.game_log');
    var new_log_item = document.createElement('li');
    var date = new Date();
    new_log_item.setAttribute('class', 'list-item');
    new_log_item.innerHTML = "(" + date.getHours() + ":" +date.getMinutes() + ":" + date.getSeconds() + "): " +  data['data']['name'] + ' entered room!';
    game_log.prepend(new_log_item);
  });
  /*** END OF JOIN ROOM EVENT AND RESPONSE HANDLER ***/

  /*** HANDLE SHOOT RESPONSE ***/
  socket.on('shoot_response', function(data) {
    var coords = {
                  x: data['data']['x'],
                  y: data['data']['y']
                };
    hit_ship(coords, ships_global, room);
    your_turn = true;
    document.querySelector(".info_span").innerHTML = ""
    document.querySelector(".info_span2").innerHTML = ""
    document.querySelector('.info_span').innerHTML = "Your turn!";

    var cells = document.querySelectorAll(".player");
    cells.forEach(function(cell) {
      if(cell.dataset.x == coords.x && cell.dataset.y == coords.y) {
        cell.style.background = 'red';
        cell.innerHTML = "X";
      }
    });
  });
  /*** END OF SHOOT RESPONSE HANDLER ***/

  /*** HANDLE SHIP HIT RESPONSE ***/
  socket.on('hit_response', function(data) {

    if(data['data']['hit'] == true) {
      var cells = document.querySelectorAll('.opponent');
      cells.forEach(function(cell) {
        if(cell.dataset.x == data['data']['x'] && cell.dataset.y == data['data']['y']) {
          document.querySelector(".info_span").innerHTML = ""
          document.querySelector(".info_span2").innerHTML = ""
          document.querySelector(".info_span2").innerHTML = "Hit!"
          cell.classList.add('hit');
          cell.innerHTML = "X";

          // add info to game log window
          var game_log = document.querySelector('.game_log');
          var new_log_item = document.createElement('li');
          var date = new Date();
          new_log_item.setAttribute('class', 'list-item');
          new_log_item.innerHTML = "(" + date.getHours() + ":" +date.getMinutes() + ":" + date.getSeconds() + "): You shot " + data['data']['name'] + '\'s ship!';
          game_log.prepend(new_log_item);
        };
      });
    }
  });
  /*** END OF SHIP HIT RESPONSE HANDLER ***/

  /*** HANDLE SHIP SINK RESPONSE ***/
  socket.on('sink_response', function(data) {
    var game_log = document.querySelector('.game_log');
    var new_log_item = document.createElement('li');
    var date = new Date();
    new_log_item.setAttribute('class', 'list-item');
    new_log_item.style.color = "green";
    new_log_item.innerHTML = "(" + date.getHours() + ":" +date.getMinutes() + ":" + date.getSeconds() + "): You sank " + data['data']['name'] + '\'s ship!';
    game_log.prepend(new_log_item);
  });
  /*** END OF SHIP SINK REPOSNE HANDLER ***/

  /*** HANDLE PLAYER READY EVENT AND RESPONSE ***/
  start_button.addEventListener('click', function() {
    var data_to_send = {name: name, room: room}
    socket.emit('player_ready_event', data_to_send)
    this.setAttribute('hidden', true);
  });

  socket.on('player_ready_response', function(data) {
    your_turn = true;
    document.querySelector(".info_span").innerHTML = "You will shoot first!";
  });
  /*** END OF PLAYER READY EVENT AND RESPONSE HANDLER ***/

  /*** HANDLE CHAT EVENT AND RESPONSE ***/
  chat_button.addEventListener('click', function() {
    var data_to_send = { message: document.querySelector('.chat_input').value,
                    name: name,
                    room, room
                  };
    var chat_list = document.querySelector('.chat_container');
    var new_message = document.createElement('div');
    new_message.setAttribute('class', 'chat_message sent');
    new_message.innerHTML = name + ": " + data_to_send.message;
    chat_list.prepend(new_message);
    document.querySelector('.chat_input').value = "";

    socket.emit('chat_event', data_to_send);
  });

  socket.on('chat_response', function(data) {
    var chat_list = document.querySelector('.chat_container');
    var new_message = document.createElement('div');
    new_message.setAttribute('class', 'chat_message answer');
    new_message.innerHTML = data['data']['name'] + ': ' + data['data']['message']
    chat_list.prepend(new_message);
    document.querySelector('.chat_input').value = "";
  });
  /*** END OF CHAT EVENT AND RESPONSE HANDLER ***/

  /*** HANDLE GAME START EVENT AND RESPONSE ***/
  socket.on('game_ready_response', function(data) {

    game_ready = true;
    if(your_turn == true) {
      document.querySelector('.info_span').innerHTML = "Your turn!";
    }
    else {
      document.querySelector('.info_span').innerHTML = "Wait for your turn!";
    }
  });
  /*** END OF GAME START EVENT AND RESPONSE HANDLER ***/

  /*** HANDLE GAME OVER EVENT AND RESPONSE ***/
  socket.on("game_over_response", function(data) {
    document.querySelector(".info_span2").innerHTML = ""
    document.querySelector(".info_span").innerHTML = ""
    document.querySelector(".info_span").innerHTML = `Game over! You won!`;
    game_ready = false;
  });
  /*** END OF GAME OVER EVENT AND RESPONSE HANDLER ***/

});
/*** END OF DOM CONTENT LOADED EVENT ***/

function render_game_row(i) {
  var game_row = document.createElement('div');
  game_row.classList.add('game_row');

  return game_row;
}

function render_game_cell(i, j, class_type) {
  var game_cell = document.createElement('div');
  game_cell.classList.add('game_cell', class_type);
  game_cell.setAttribute('data-x', i);
  game_cell.setAttribute('data-y', j);
  game_cell.innerHTML="0";

  //handle click event, send coordination data to server
  game_cell.addEventListener('click', function() {
    if(this.classList.contains('player')) {

      var radio_button = document.querySelector('input[name=ship_type]:checked');

      if(is_legal(this, game_board) == true) {
        add_ship(radio_button, ships_global, this, game_board);
      }
      else {
        document.querySelector(".info_span").innerHTML = 'You can\'t add ship here!';
      }
    };

    if((this.classList.contains('opponent') && !(this.classList.contains('clicked'))) && (your_turn == true && game_ready == true)) {

      this.classList.add('clicked');
      coords = {x: this.dataset.x,
                y: this.dataset.y,
                room: room}
      your_turn = false;

      document.querySelector('.info_span').innerHTML = "";
      document.querySelector('.info_span').innerHTML = "Wait for your turn!";

      socket.emit('shoot_event', coords);
    };

  }) // end of click event

  return game_cell;
};

function render_game_board(game_div, class_type) {
  for(var i = 1; i <= 10; i++) {

    var game_row = render_game_row(i);
    game_div.appendChild(game_row);

    for(var j = 1; j <= 10; j++) {

      var game_cell = render_game_cell(i, j, class_type);
      game_row.appendChild(game_cell);
    };

  };
}; // end of render game board function

function hit_ship(coords, ships_global, room) {

  var ship_1 = ships_global[1].ships;
  var ship_2 = ships_global[2].ships;
  var ship_3 = ships_global[3].ships;
  var ship_4 = ships_global[4].ships;
  for(var i = 0; i < ship_1.length; i++) {
    ship_1[i].hit(coords, room);
  };
  for(var i = 0; i < ship_2.length; i++) {
    ship_2[i].hit(coords, room);
  };
  for(var i = 0; i < ship_3.length; i++) {
    ship_3[i].hit(coords, room);
  };
  for(var i = 0; i < ship_4.length; i++) {
    ship_4[i].hit(coords, room);
  };

}; // end of hit_ship function

function is_legal(game_cell, game_board) {
  if(game_board[game_cell.dataset.x][game_cell.dataset.y] == true) {
    return true
  }
    return false
}; // end of is_legal function


function add_ship(radio_button, ships_global, game_cell, game_board) {

  var ships_obj = ships_global[radio_button.dataset.size];
  var ships_arr = ships_obj.ships;
  var last_ship = ships_arr[ships_obj.ships_quantity - 1];

  if(last_ship == null || last_ship.is_created() == true) {

      if(ships_obj.ships_quantity >= ships_obj.ships_amount) {
          document.querySelector(".info_span").innerHTML = "You have enough ships of this type!";
      }
      else {

        var ship_id = ships_obj.ships_quantity + 1;
        var new_ship = new Ship(radio_button.dataset.size, ship_id);

        new_ship.save_coords(game_cell.dataset.x, game_cell.dataset.y);
        ships_arr.push(new_ship);
        ships_obj.ships_quantity += 1;

        game_board[game_cell.dataset.x][game_cell.dataset.y] = false;

        game_cell.classList.add("ship");
        game_cell.innerHTML = radio_button.dataset.size;

        document.querySelector(`.inner_span${radio_button.dataset.size}`).innerHTML = ship_id;
        document.querySelector(".info_span").innerHTML = `Added new ship of size ${radio_button.dataset.size}!`;
        cell_counter += 1;
      }
  }
  else {
          if(last_ship.check_coords(game_cell.dataset.x, game_cell.dataset.y) == true) {

              last_ship.save_coords(game_cell.dataset.x, game_cell.dataset.y);
              last_ship.last_coord_index++;
              game_board[game_cell.dataset.x][game_cell.dataset.y] = false;

              game_cell.classList.add("ship");
              game_cell.innerHTML = radio_button.dataset.size;
              cell_counter += 1;

              if(cell_counter == 20) {
                document.querySelector('.start_button').removeAttribute('hidden');
              }
        };

      };
}; // end of add ship function

function create_game_board() {
  var arr = [];
  for(var i = 0; i < 12; i++) {
    arr[i] = [];
    for(var j = 0; j < 12; j++) {
      var arr2 = []
      arr[i].push(arr2);
    }
  }

  for(var i = 0; i < 12; i++) {
    for(var j = 0; j < 12; j++) {
      arr[i][j] = true;
    }
  }
  return arr;
}


class Ship {
  constructor(ship_size, ship_id) {
    this.ship_id = ship_id;
    this.ship_size = ship_size;
    this.sinked = false;
    this.coords = [];
    this.last_coord_x = 0;
    this.last_coord_y = 0;
    this.next_coord_x_up = 0;
    this.next_coord_x_down = 0;
    this.next_coord_y_left = 0;
    this.next_coord_y_right = 0;
    this.coords_hit = 0;
    for(let i = 0; i < this.ship_size; i++) {
      this.coords[i] = {exist: false};
    };

  }; // end of constructor

  is_created() {
    for(let i = 0; i < this.ship_size; i++) {
        if(this.coords[i].exist == false) {
          return false;
      };
    };

    return true;
  }; // end of is created method

  save_coords(x, y) {
    if(this.is_created() == false) {

      for(let i = 0; i < this.ship_size; i++) {
          if(this.coords[i].exist == false) {

              this.coords[i] = {
                              exist: true,
                              coord_1: x,
                              coord_2: y,
                              hit: false
                            };
                this.last_coord_x = x;
                this.last_coord_y = y;
                this.next_coord_x_up = parseInt(x) - 1;
                this.next_coord_x_down = parseInt(x) + 1;
                this.next_coord_y_left = parseInt(y) - 1;
                this.next_coord_y_right = parseInt(y) + 1;
                break;
          };
        };

        if(this.is_created() == true) {
          this.prevent_touch(game_board);
        };
      };
    }; // end of save coords method

    check_coords(x, y) {
            console.log("check coords active")
      if((x == this.next_coord_x_up) && (y == this.last_coord_y) || (x == this.next_coord_x_down) && (y == this.last_coord_y)) {
        console.log("check coords returned true")
        return true;
      }
      if((y == this.next_coord_y_left) && (x == this.last_coord_x) || (y == this.next_coord_y_right) && (x == this.last_coord_x)) {
        console.log("check coords returned true")
        return true;
      }

      console.log("check coords returned false")
      return false;
    } // end of check coords method

    prevent_touch(game_board) {
      for(var i = 0; i < this.coords.length; i++) {
        var x = this.coords[i].coord_1;
        var y = this.coords[i].coord_2;
        game_board[parseInt(x)][parseInt(y)-1] = false;
        game_board[parseInt(x)][parseInt(y)+1] = false;
        game_board[parseInt(x)-1][parseInt(y)] = false;
        game_board[parseInt(x)-1][parseInt(y)-1] = false;
        game_board[parseInt(x)-1][parseInt(y)+1] = false;
        game_board[parseInt(x)+1][parseInt(y)] = false;
        game_board[parseInt(x)+1][parseInt(y)-1] = false;
        game_board[parseInt(x)+1][parseInt(y)+1] = false;
      };
    }; // end of prevent touch method

    hit(coords, room) {
      if(this.sinked == false) {

        for(var i = 0; i < this.coords.length; i++) {

          // handle hit event
          if(this.coords[i].coord_1 == coords.x && this.coords[i].coord_2 == coords.y) {
            this.coords[i].hit = true;
            this.coords_hit += 1;

            var message = {x: this.coords[i].coord_1, y: this.coords[i].coord_2, room: room, name: name, hit: true}
            socket.emit('hit_event', message);

            var game_log = document.querySelector('.game_log');
            var new_log_item = document.createElement('li');
            var date = new Date();
            new_log_item.setAttribute('class', 'list-item');
            new_log_item.style.color = "orange";
            new_log_item.innerHTML = "(" + date.getHours() + ":" +date.getMinutes() + ":" + date.getSeconds() + "): Your ship was hit!";
            game_log.prepend(new_log_item);

            // handle sink event
            if(this.coords_hit == this.ship_size) {
              this.sinked = true;
              sinked_ships += 1;

              var game_log = document.querySelector('.game_log');
              var new_log_item = document.createElement('li');
              var date = new Date();
              new_log_item.setAttribute('class', 'list-item');
              new_log_item.style.color = "red";
              new_log_item.innerHTML = "(" + date.getHours() + ":" +date.getMinutes() + ":" + date.getSeconds() + "): Your ship sanked!";
              game_log.prepend(new_log_item);

              var message = {name: name, room: room}
              socket.emit("sink_event", message)

              if(sinked_ships == 10) {
                var message = {name: name, room: room}
                socket.emit("game_over_event", message);
                document.querySelector(".info_span").innerHTML = "";
                document.querySelector(".info_span").innerHTML = "YOU LOST!!!";
                game_ready = false;
              }
            }
          return true;
        }

      }// end of for loop
    } // end of if(this.sinked == true)
  } // end of hit method

}; // end of lass Ship
