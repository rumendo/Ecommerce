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

function displayManufactures(){
    var url = 'http://localhost:3000/filter/allManufacturers';
    console.log(url);
    downloadUrl(url, function(result) {
        console.log(result.rows);
        var options = '<h3>Manufacturer</h3>';
        Array.prototype.forEach.call(result.rows, function(element){

            options +=
                '<div></div><input type="checkbox" id="' + element['manufacturer'] +
                '" name="manufacturer" value="' + element['manufacturer'] +
                '"><label for="' + element['manufacturer'] +
                '">&nbsp;&nbsp;' + element['manufacturer'] +
                '</label></div>';

        });
        options += $('#filters').html();
        $('#filters').html(options);
    });
}

// function displayPrices(){
//     var url = 'http://localhost:3000/filter/prices/' + type;
//     console.log(url);
//     downloadUrl(url, function(result) {
//         console.log(result.rows);
//         var options = $('#filters').html();
//
//
//
//         $('#filters').html(options);
//     });
// }
//
$(window).bind("load", function() {
    displayManufactures();
});