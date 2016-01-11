(function ($) {
    $(function () {

        $('.button-collapse').sideNav();
        $('.parallax').parallax();

    }); // end of document ready

    $('.member').each(function () {
        var $this = $(this);

        if ('Offline' != $this.find('.viewers').text()) {
            $this.find('.circle').addClass('online');
        }
        else {
            $this.find('.circle').addClass('offline');
        }
    });
})(jQuery); // end of jQuery name space