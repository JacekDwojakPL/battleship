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

document.addEventListener('DOMContentLoaded', () => {
  var game_div1 = document.querySelector('.game_div1');
  var game_div2 = document.querySelector('.game_div2');

  var player_class = "player";
  var opponent_class = "opponent";

  var player_board = render_game_board(game_div1, player_class);
  var opponent_board = render_game_board(game_div2, opponent_class);

  socket.emit('join_request', room);
  socket.on('shoot_response', function(data) {
    var cells = document.querySelectorAll(".player");
    cells.forEach(function(cell) {
      if(cell.dataset.x == data['data']['x'] && cell.dataset.y == data['data']['y']) {
        cell.style.color = 'red';
      }
    });
  });
});

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

  game_cell.addEventListener('mouseover', function() {
      this.setAttribute('style', 'background-color: red;');
    });

  game_cell.addEventListener('mouseout', function() {
      this.setAttribute('style', 'background-color: none;');
    });


  //handle click event, send coordination data to server
  game_cell.addEventListener('click', function() {
    if(this.classList.contains('player')) {

      var radio_button = document.querySelector('input[name=ship_type]:checked');

      if(is_legal(this, game_board) == true) {
        add_ship(radio_button, ships_global, this, game_board);
      }
      else {
        document.querySelector(".info_span").classList.remove("bg-success");
        document.querySelector(".info_span").classList.add("bg-danger");
        document.querySelector(".info_span").innerHTML = 'Nie mozesz dodac statku w tym miejscu!';
      }
    };

    if(this.classList.contains('opponent')) {
      this.classList.add('clicked');
      coords = {x: this.dataset.x,
                y: this.dataset.y,
                room: room}
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
}


function is_legal(game_cell, game_board) {
  if(game_board[game_cell.dataset.x][game_cell.dataset.y] == true) {
    return true
  }
    return false
}


function add_ship(radio_button, ships_global, game_cell, game_board) {

  var ships_obj = ships_global[radio_button.dataset.size];
  var ships_arr = ships_obj.ships;
  var last_ship = ships_arr[ships_obj.ships_quantity - 1];

  if(last_ship == null || last_ship.is_created() == true) {

      if(ships_obj.ships_quantity >= ships_obj.ships_amount){
          document.querySelector(".info_span").classList.remove("bg-success");
          document.querySelector(".info_span").classList.add("bg-danger");
          document.querySelector(".info_span").innerHTML = "juz jest wystarczajaco duzo statkow tego typu!";
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
        document.querySelector(".info_span").classList.remove("bg-danger");
        document.querySelector(".info_span").classList.add("bg-success");
        document.querySelector(".info_span").innerHTML = `Dodano statek o wielkosci ${radio_button.dataset.size}!`;
      }
  }
  else {
          if(last_ship.check_coords(game_cell.dataset.x, game_cell.dataset.y) == true) {

              last_ship.save_coords(game_cell.dataset.x, game_cell.dataset.y);
              last_ship.last_coord_index++;
              game_board[game_cell.dataset.x][game_cell.dataset.y] = false;

              game_cell.classList.add("ship");
              game_cell.innerHTML = radio_button.dataset.size;
        };

      };
};

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
    this.coords = [];
    this.last_coord_1 = 0;
    this.last_coord_2 = 0;
    this.next_coord_1a = 0;
    this.next_coord_1b = 0;
    this.next_coord_2a = 0;
    this.next_coord_2b = 0;
    for(let i = 0; i < this.ship_size; i++) {
      this.coords[i] = {exist: false};
    };

  };
  is_created() {
    for(let i = 0; i < this.ship_size; i++) {
        if(this.coords[i].exist == false) {
          return false;
      };
    };

    return true;
  };
  save_coords(x, y) {
    if(this.is_created() == false) {
      for(let i = 0; i < this.ship_size; i++) {
          if(this.coords[i].exist == false) {

              this.coords[i] = {
                              exist: true,
                              coord_1: x,
                              coord_2: y
                            };
                this.last_coord_upDown = x;
                this.last_coord_leftRight = y;
                this.next_coord_1_up = parseInt(x) - 1;
                this.next_coord_1_down = parseInt(x) + 1;
                this.next_coord_2_left = parseInt(y) - 1;
                this.next_coord_2_right = parseInt(y) + 1;
                break;
          };
        };

        if(this.is_created() == true) {
          this.prevent_touch(game_board);
        };
      };
    }; // end of save coords

    check_coords(x, y) {
      if((x == this.next_coord_1_up) && (y == this.last_coord_leftRight) || (x == this.next_coord_1_down) && (y == this.last_coord_leftRight)) {
        return true;
      }
      if((y == this.next_coord_2_left) && (x == this.last_coord_upDown) || (y == this.next_coord_2_right) && (x == this.last_coord_upDown)) {
        return true;
      }

      return false;
    }

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

    };
};
