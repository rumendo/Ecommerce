$('#first_name').on('input',function(){
    var input=$(this).val();
    if(input.length > 100){
        $('#first_name_err').text("Entered name is too long!");
        $('#signup_button').hide();
    }else if(/[^a-z]/i.test(input)){
        $('#first_name_err').text("Name contains invalid characters!");
        $('#signup_button').hide();

    }else{
        $('#first_name_err').text("");
        $('#signup_button').show();
    }
    console.log($('#first_name_err').html());
});

$('#last_name').on('input',function(){
    var input=$(this).val();
    if(input.length > 50){
        $('#last_name_err').text("Entered name is too long!");
        $('#signup_button').hide();
    }else if(/[^a-z]/i.test(input)){
        $('#last_name_err').text("Name contains invalid characters!");
        $('#signup_button').hide();

    }else{
        $('#last_name_err').text("");
        $('#signup_button').show();
    }
});

$('#email').on('input',function(){
    var input=$(this).val();
    if(input.length > 100){
        $('#email_err').text("Entered email is too long!");
        $('#signup_button').hide();
    }else{
        $('#email_err').text("");
        $('#signup_button').show();
    }
});

$('#address').on('input',function(){
    var input=$(this).val();
    if(input.length > 100){
        $('#address_err').text("Entered address is too long!");
        $('#signup_button').hide();
    }else{
        $('#address_err').text("");
        $('#signup_button').show();
    }
});

$('#phone').on('input',function(){
    var input=$(this).val();
    if(input.length > 50){
        $('#phone_err').text("Entered phone number is too long!");
        $('#signup_button').hide();
    }else if(!/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(input)){
        $('#phone_err').text("Invalid phone number!");
        $('#signup_button').hide();

    }else{
        $('#phone_err').text("");
        $('#signup_button').show();
    }
});

$('#country').on('input',function(){
    var input=$(this).val();
    if(input.length > 75){
        $('#country_err').text("Entered country name is too long!");
        $('#signup_button').hide();
    }else{
        $('#country_err').text("");
        $('#signup_button').show();
    }
});

$('#city').on('input',function(){
    var input=$(this).val();
    if(input.length > 50){
        $('#city_err').text("Entered city name is too long!");
        $('#signup_button').hide();
    }else{
        $('#city_err').text("");
        $('#signup_button').show();
    }
});
