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

function displayManufactures(type){
    var url = 'http://localhost:3000/getManufacturers/' + type;
    console.log(url);
    downloadUrl(url, function(result) {
        var options = '';
        Array.prototype.forEach.call(result, function(element){
            options += '<option value="'+element+'"/>';
        });
        document.getElementById('manufacturers').innerHTML = options;
    });
}