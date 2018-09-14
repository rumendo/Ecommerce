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


$('.data').keypress(function (data) {
    console.log("lol");
    if(data.which === 13) {
        var url = 'http://localhost:3000/userDataChange?attribute=' + $(this).data('attribute') + '&data=' + $(this).val() + '&uid=' + $(this).data('id');
        console.log(url);
        downloadUrl(url, function (result) {
            location.reload();
            console.log(result);
        });
    }
});