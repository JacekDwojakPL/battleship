document.addEventListener('DOMContentLoaded', () => {

  var game_div1 = document.querySelector('.game_div1');
  var game_div2 = document.querySelector('.game_div2');
  var player_class = "player";
  var opponent_class = "opponent";
  create_game_board(game_div1, player_class);
  create_game_board(game_div2, opponent_class);

});


function create_game_row(i) {
  var game_row = document.createElement('div');
  game_row.classList.add('game_row');

  return game_row;
}

function create_game_cell (i, j, class_type) {
  var game_cell = document.createElement('div');
  game_cell.classList.add('game_cell', class_type);
  game_cell.setAttribute('data-x', i);
  game_cell.setAttribute('data-y', j);

  if(game_cell.classList.contains('player')) {

    game_cell.addEventListener('mouseover', function() {
      this.setAttribute('style', 'background-color: red;');
    });

    game_cell.addEventListener('mouseout', function() {
      this.setAttribute('style', 'background-color: none;');
    });
  };




  //handle click event, send coordination data to server
  game_cell.addEventListener('click', function() {
    if(this.classList.contains('player')) {

      var params = "?x=" + this.dataset.x + "&y=" + this.dataset.y;

      var request = new XMLHttpRequest();
      request.open('GET', Flask.url_for('coords')+params, true);
      request.onload = function() {
        var response = JSON.parse(request.responseText);
        change_color(response);
      };

      request.send();
    };
  })

  return game_cell;
};

function create_game_board(game_div, class_type) {
  for(var i = 0; i < 8; i++) {

    var game_row = create_game_row(i);
    game_div.appendChild(game_row);

    for(var j = 0; j < 8; j++) {

      var game_cell = create_game_cell(i, j, class_type);
      game_row.appendChild(game_cell);
    };

  };
}


function change_color(response) {
  var game_cells = document.querySelectorAll('.opponent');

  game_cells.forEach(function(cell) {
    if(cell.dataset.x == response['x'] && cell.dataset.y == response['y']) {
      cell.setAttribute('style', 'background-color: red;')
    };
  });
}
