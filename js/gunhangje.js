$(document).ready(function(){
//언어 선택 드롭다운 메뉴
    $('header .lang_dep2').hide();
    $('header .lang>li').hover(function(){
        $('header .lang_dep2').stop().slideToggle();
    });
    
//모바일 메뉴
    $('#menu').removeClass('on');
    $('.m_icon').click(function(){
        $('#menu').addClass('on');
    });
    $('.close').click(function(){
        $('#menu').removeClass('on');
    });

//모바일 메뉴: 언어
    $('.m_lang .lang_dep2').hide();
    $('.m_lang>li>a').click(function(){
        $('.lang_dep2').fadeIn();
    });
    $('.lang_dep2>li>a').click(function(){
        $('.lang_dep2').fadeOut();
    });

//스크롤에 따른 메뉴 변화
    var lastScroll = 0;
     $(window).scroll(function(event){
          var scroll = $(this).scrollTop();
          if (scroll > 500){
          //이벤트를 적용시킬 스크롤 높이
               $("#menu").addClass("B");
          }
          else {
               $("#menu").removeClass("B");
          }
          lastScroll = scroll;
     });
//출처: https://claire-design.tistory.com/entry/JQuery-스크롤-높이에-따른-클래스-추가삭제 [Claire.K Art Designer]

//메뉴 버튼 클릭시 부드러운 이동
    $('.gotop a').click(function(e){
      e.preventDefault(); //a태그이기때문에 버벅거림?빼기
     $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500);
   });
    $('.gnb li a').click(function(e){
    $('.gnb li').removeClass('menu-on'); //클릭시 변화가 필요하니, 효과 클래스빼기
    $(this).parent('li').addClass('menu-on');//선택된 것에 효과클래스넣기
      e.preventDefault(); //a태그이기때문에 버벅거림?빼기
     $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500);//부드럽게 스크롤 이동하는부분 - 53부분은 고정 header이기때문에 추가됨, 고정 header가 아닌 경우 삭제
   });
//출처: https://m.blog.naver.com/PostView.nhn?blogId=eunjin10914&logNo=221035188392&proxyReferer=https:%2F%2Fwww.google.com%2F

//메인 비주얼 bxSlider
    $('.mv').bxSlider({
        auto: true,
        controls: false,
        speed: 700
    });
    
//행사일정 모바일
    $(window).resize(function(){
        if($(window).width()<767){
            $('.calendar .month>ul').removeClass('on');
            $('.month>li').click(function(){
                $(this).children('.date').addClass('on');
                $(this).siblings().children('.date').removeClass('on');
            })
        }
    });

//관광 안내 버튼
    $('.map li').hide();
    $('.map_bar2 li').click(function(){
        $(this).addClass('on');
        $(this).siblings().removeClass('on');
    });
    $('.map_bar2 li:nth-child(1)').click(function(){
        $('.map li:nth-child(1)').fadeIn();
        $('.map li:nth-child(1)').siblings().fadeOut();
    });
    $('.map_bar2 li:nth-child(2)').click(function(){
        $('.map li:nth-child(2)').fadeIn();
        $('.map li:nth-child(2)').siblings().fadeOut();
    });
    $('.map_bar2 li:nth-child(3)').click(function(){
        $('.map li:nth-child(3)').fadeIn();
        $('.map li:nth-child(3)').siblings().fadeOut();
    });
    $('.map_bar2 li:nth-child(4)').click(function(){
        $('.map li:nth-child(4)').fadeIn();
        $('.map li:nth-child(4)').siblings().fadeOut();
    });
    $('.map_bar2 li:nth-child(5)').click(function(){
        $('.map li:nth-child(5)').fadeIn();
        $('.map li:nth-child(5)').siblings().fadeOut();
    });
    $('.map_bar2 li:nth-child(6)').click(function(){
        $('.map li:nth-child(6)').fadeIn();
        $('.map li:nth-child(6)').siblings().fadeOut();
    });
//버스 정보 슬라이드 메뉴
    $('#info .bus_info').hide();
    $('#info .map_bar1>li>a').click(function(){
        event.preventDefault();
        $(this).hide();
        $('#info .bus_info').fadeIn();
    });
    $(document).mouseup(function(e){
       var container=$("#info .bus_info");
        if(container.has(e.target).length===0)
            container.fadeOut();
        $('#info .map_bar1>li>a').show();
    });
//출처: https://poponyang.tistory.com/entry/jQuery-%EB%A0%88%EC%9D%B4%EC%96%B4-%EB%B0%94%EA%B9%A5-%ED%81%B4%EB%A6%AD%ED%95%A0-%EB%95%8C-%EB%A0%88%EC%9D%B4%EC%96%B4-%EC%82%AC%EB%9D%BC%EC%A7%80%EA%B2%8C-%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95
    
//버스 라인 정보
    $('#info .shuttle>ul li:nth-child(3) table tr:nth-child(1) td:nth-child(1) p').hide();
    $('#info .shuttle>ul li:nth-child(3) table li.yellow').click(function(){
        $('#info .shuttle>ul li:nth-child(3) table p.yellow').show();
        $('#info .shuttle>ul li:nth-child(3) table p.yellow').siblings().hide();
    });
    $('#info .shuttle>ul li:nth-child(3) table li.red').click(function(){
        $('#info .shuttle>ul li:nth-child(3) table p.red').show();
        $('#info .shuttle>ul li:nth-child(3) table p.red').siblings().hide();
    });
    $('#info .shuttle>ul li:nth-child(3) table li.blue').click(function(){
        $('#info .shuttle>ul li:nth-child(3) table p.blue').show();
        $('#info .shuttle>ul li:nth-child(3) table p.blue').siblings().hide();
    });
    $('#info .shuttle>ul li:nth-child(3) table li.green').click(function(){
        $('#info .shuttle>ul li:nth-child(3) table p.green').show();
        $('#info .shuttle>ul li:nth-child(3) table p.green').siblings().hide();
    });
});

//갤러리 이미지 가로 세로 고정
$(window).resize(function(){
    $('#gallery .area li.square').each(function(){
        $(this).height($(this).width());
    });
    $('#gallery .area_3 li:nth-child(2)').each(function(){
        $(this).height($('#gallery .area_3 li.square').width());
    });
}).resize();
//출처: https://avada.tistory.com/1855