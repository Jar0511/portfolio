$(document).ready(function(){
    $('.slider').bxSlider({
        mode:'fade',
        controls: false
    });
    $('.bx-wrapper a').click(function(){
        return false;
    });
});