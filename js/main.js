/*!
 * main.js
 * Author: Kaitlyn Reese
 */

(function ($) {
    $('.container').fadeIn(); // wait for jQuery to load to display content
    
    var cardify = $('#credit-card-entry').cardify({
        onValid: function() {
            $('#submit').prop('disabled', false);
            
            $('.credit-card').submit(function(e) {
                e.preventDefault();
                var params = $(this).serializeArray(); // sample set of params resulting from card input
                
                $('.content').fadeOut(500, function() {
                    $(this).removeClass('row').html('<h3 class="title">Thanks!</h3><div class="row"><div class="gnocchi col-lg-6"><img src="img/gnocchi.jpg" alt="Gnocchi" /></div><div class="col-lg-6"><img src="img/cheesecake.jpg" alt="Cheesecake" /></div></div>');
                    $(this).fadeIn();
                });
                return;
                
                $.post( // sample ajax call to send data
                    'INSERT_URL_HERE',
                    params,
                    function() {
                        // callback
                });
            });
        },
        onIncomplete: function() {
            $('#submit').prop('disabled', true);
        }
    });
}(jQuery));