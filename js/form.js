$(function() {
    var form = $('#ajax-contact');
    var formMessages = $('#form-messages');

    $(form).submit(function(e) {
        e.preventDefault(); // Prevent default form submission
        
        var formData = $(form).serialize();

        $.ajax({
            type: 'POST',
            url: $(form).attr('action'), // Use the form's action attribute
            data: formData
        })
        .done(function(response) {
            $(formMessages).removeClass('bg-danger').addClass('bg-success');
            $(formMessages).text('Your message was successfully sent.');
            $('#name, #email, #message').val('');
        })
        .fail(function(data) {
            $(formMessages).removeClass('bg-success').addClass('bg-danger');
            if (data.responseText !== '') {
                $(formMessages).text(data.responseText);
            } else {
                $(formMessages).text('Oops! An error occurred and your message could not be sent.');
            }
        });
    });
});
