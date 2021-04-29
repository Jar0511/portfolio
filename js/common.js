$(document).ready(function(){
    $('.slider').bxSlider({
        mode:'fade',
        controls: false,
        touchEnabled: false
    });
    $('.bx-pager.bx-default-pager>a').click(function(){
        event.preventDefault();
    });
});