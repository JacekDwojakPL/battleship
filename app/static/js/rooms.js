var room_button = document.querySelector("#room_button");
room_button.addEventListener("click", function() {

  if (document.querySelector('[name="new_room_name"]').value != "") {

    var request = new XMLHttpRequest();
    var form = new FormData();

    form.append("room_name", document.querySelector('[name="new_room_name"]').value);
    request.open('POST', Flask.url_for("create_room"));

    request.onload = function() {

    var response = JSON.parse(request.responseText);
    var room_list = document.querySelector('.room_list');
    var new_room_item = document.createElement('li');

    var new_room_form = document.createElement('form');
    new_room_form.setAttribute('method', 'POST');
    new_room_form.setAttribute('action', `/game/${response['name']}`)

    var new_room_input = document.createElement('input');
    new_room_input.setAttribute('type', 'text');
    new_room_input.setAttribute('name', 'player_name');
    new_room_input.setAttribute('placeholder', 'Player name');
    new_room_input.setAttribute('required', true);

    var new_room_span = document.createElement('span');
    new_room_span.setAttribute('class', 'players_count');
    new_room_span.innerHTML = "Players: 0/2";

    var new_room_button = document.createElement('button');
    new_room_button.setAttribute('type', 'submit');
    new_room_button.setAttribute('class', 'btn btn-primary');
    new_room_button.innerHTML = "Enter";


    var new_room_link = document.createElement('a');
    new_room_link.setAttribute('href', '');
    new_room_link.innerHTML = `${response['name']}`;

    new_room_form.appendChild(new_room_link);
    new_room_form.appendChild(new_room_span);
    new_room_form.appendChild(new_room_input);
    new_room_form.appendChild(new_room_button);

    new_room_item.appendChild(new_room_form);
    room_list.appendChild(new_room_item);
  }; // end of request onload handler
  request.send(form);
} // end if

  return false;
}); // end of click handler
