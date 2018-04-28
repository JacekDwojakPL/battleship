var room_button = document.querySelector("#room_button");
room_button.addEventListener("click", function() {

  var request = new XMLHttpRequest();
  var form = new FormData();

  form.append("room_name", document.querySelector('[name="new_room_name"]').value);
  request.open('POST', Flask.url_for("create_room"));
  request.onload = function() {
    var response = JSON.parse(request.responseText);
    console.log(response);
    var room_list = document.querySelector('.room_list');
    var new_room_item = document.createElement('li');
    var new_room_link = document.createElement('a');
    new_room_link.setAttribute('href', `/game/${response['name']}`);
    new_room_link.innerHTML = `${response['name']}`;
    new_room_item.appendChild(new_room_link)
    room_list.appendChild(new_room_item);
  };
  request.send(form);

  return false;
});
