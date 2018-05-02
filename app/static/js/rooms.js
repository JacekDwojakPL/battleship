var room_button = document.querySelector("#room_button");
room_button.addEventListener("click", function() {

  if (document.querySelector('[name="new_room_name"]').value != "") {

    var request = new XMLHttpRequest();
    var form = new FormData();

    form.append("room_name", document.querySelector('[name="new_room_name"]').value);
    request.open('POST', Flask.url_for("create_room"));

    request.onload = function() {

    var response = JSON.parse(request.responseText);
    var rooms_div = document.querySelector('.rooms_div');
    var new_room_row = document.createElement('div');
    var new_room_col_1 = document.createElement('div');
    var new_room_col_2 = document.createElement('div');
    var new_room_col_3 = document.createElement('div');

    new_room_row.setAttribute('class', 'row room_row text-center mt-2 mb-2')
    new_room_col_1.setAttribute('class', 'col-12 col-md-2 pt-3 pb-3');
    new_room_col_2.setAttribute('class', 'col-12 col-md-2 pt-3 pb-3');
    new_room_col_3.setAttribute('class', 'col-12 col-md-8 pt-3 pb-3');

    var new_room_link = document.createElement('a');
    new_room_link.setAttribute('href', '');
    new_room_link.innerHTML = `${response['name']}`;
    new_room_col_1.appendChild(new_room_link);

    var new_room_span = document.createElement('span');
    new_room_span.setAttribute('class', 'players_count');
    new_room_span.innerHTML = "Players: 0/2";
    new_room_col_2.appendChild(new_room_span);

    var new_room_input = document.createElement('input');
    new_room_input.setAttribute('type', 'text');
    new_room_input.setAttribute('name', 'player_name');
    new_room_input.setAttribute('placeholder', 'Your name');
    new_room_input.setAttribute('required', true);

    var new_room_button = document.createElement('button');
    new_room_button.setAttribute('type', 'submit');
    new_room_button.setAttribute('class', 'btn btn-primary');
    new_room_button.innerHTML = "Enter";

    var new_room_form = document.createElement('form');
    new_room_form.setAttribute('method', 'POST');
    new_room_form.setAttribute('action', `/game/${response['name']}`)

    new_room_form.appendChild(new_room_input);
    new_room_form.appendChild(new_room_button);

    new_room_col_3.appendChild(new_room_form);

    new_room_row.appendChild(new_room_col_1);
    new_room_row.appendChild(new_room_col_2);
    new_room_row.appendChild(new_room_col_3);
    rooms_div.appendChild(new_room_row);

    var empty_room_info = document.querySelector('.empty_room_info');
    empty_room_info.setAttribute('hidden', 'true');
  }; // end of request onload handler
  request.send(form);
} // end if

  document.querySelector('[name="new_room_name"]').value = "";
  return false;
}); // end of click handler
