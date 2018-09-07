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

$('.product').on('keyup mouseup', function (data) {
    var url = 'http://localhost:3000/admin/products/availableQuantityUpdate?available_quantity=' + $(this).val() + '&pid=' + data.currentTarget.id.substr(18);
    console.log(url);
    downloadUrl(url, function(result) {
        location.reload();
        console.log(result);
    });
});
