var selCountry = 0;
var selCity = 0;
var latCenter = 42.688058;
var lngCenter = 23.319961;
var url;

// function readCC(){
//   url = 'http://localhost:3000/?load=1';
//   downloadUrl(url, function(result) {
//     displayCC(result);
//   });
//   url = 'http://localhost:3000/?loadAll=1';
//   console.log(url);
//   initMap(url);
// }

$("#cities").on('input', function(){
  var url = 'http://localhost:3000/contacts/map?';
  document.getElementById("error").innerHTML="";
  selCountry = $("#CC").val();
  selCity = $("#cities").val();
  if(selCountry){
    url += '&selCountry=' + selCountry;
  }
  if(selCity){
    url += '&selCity=' + selCity;
  }
  initMap(url);
});


function initMap(url) {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(latCenter, lngCenter),
    zoom: 11
  });
  var infoWindow = new google.maps.InfoWindow;
  console.log(url);

  downloadUrl(url, function(result) {
    Array.prototype.forEach.call(result, function(element) {
      var id = element.id;
      var name = element.name;
      var address = element.address;
      var type = element.type;
      var point = new google.maps.LatLng(
          parseFloat(element.lat),
          parseFloat(element.lng));

      var infowincontent = document.createElement('div');
      var strong = document.createElement('strong');
      strong.textContent = name
      infowincontent.appendChild(strong);
      infowincontent.appendChild(document.createElement('br'));
      var text = document.createElement('text');
      text.textContent = element.lat + ', ' + element.lng;
      infowincontent.appendChild(text);

      var marker = new google.maps.Marker({
        map: map,
        position: point,
      });
      marker.addListener('click', function() {
        infoWindow.setContent(infowincontent);
        infoWindow.open(map, marker);
      });
    });
  });
}

function downloadUrl(url, callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          var myArr = JSON.parse(this.responseText);
          callback(myArr);
      }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function encodeQueryData(data) {
  let ret = [];
  for (let d in data)
   ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
  return ret.join('&');
}

// function displayCC(result){
//   var options = '';
//   Array.prototype.forEach.call(result, function(element){
//     options += '<option value="'+element+'"/>';
//   });
//   document.getElementById('country').innerHTML = options;
// }

function readCities(country){
  var url = 'http://localhost:3000/contacts/map?country=' + country;
  downloadUrl(url, function(result) {
    displayCities(result);
  });
}
function displayCities(result){
  var options = '';
  Array.prototype.forEach.call(result, function(element){
    options += '<option value="'+element+'"/>';
  });
  document.getElementById('city').innerHTML = options;
}


timer2 = 0;
function selectCountry (){
  readCities(selCountry);
}

$("#CC").on('input', function(e){
  selCountry = this.value;
    if (timer2) {
        clearTimeout(timer2);
    }
    timer2 = setTimeout(selectCountry, 500);
});
