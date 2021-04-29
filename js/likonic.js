$(document).ready(function(){
    //gnb 메뉴 슬라이드
    $('.depth2').hide();
    $('.gnb>li').hover(function(){
        $(this).children('.depth2').stop().slideToggle();
    });
    //메인배너 슬라이드
    $('.mb').bxSlider({
        touchEnabled: false,
        auto: true,
        pager: false,
        autoHover: true
    });
    //브랜드 리스트 슬라이드
    $('.b_li').bxSlider({
        maxSlides: 3,
        moveslides: 3,
        slideWidth: 300,
        slideMargin: 40,
        pager: false
    });
    //이벤트 배너 슬라이드
    $('.event_list').bxSlider({
        touchEnabled: false,
        auto: true,
        pager: false
    });
    //추천브랜드 배경 슬라이드
    $('.br_bgs').bxSlider({
        touchEnabled: false,
        auto: true,
        controls: false
    });
    //오늘의상품 슬라이드
    $('.today_item_list').bxSlider({
        touchEnabled: false,
        auto: true,
        controls: false,
    });
    //문구 슬라이드
    $('#contents ul').bxSlider({
        pager: false,
        slideWidth: 245,
        maxSlides: 4,
        slideMargin: 40,
        moveSlides: 1,
    });
    
});