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

$('.order').on('keyup mouseup', function (data) {
    var url = 'http://localhost:3000/admin/orders/changeStatusCode?code=' + $(this).val() + '&oid=' + data.currentTarget.id.substr(4);
    console.log(url);
    downloadUrl(url, function(result) {
        location.reload();
        console.log(result);
    });
});
