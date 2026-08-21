;
(function($, window, document, undefined) {
    'use strict';
    var $winW = function() {
        return $(window).width();
    };
    var $winH = function() {
        return $(window).height();
    };
    var $screensize = function(element) {
        $(element).width($winW()).height($winH());
    };
    var screencheck = function(mediasize) {
        if (typeof window.matchMedia !== "undefined") {
            var screensize = window.matchMedia("(max-width:" + mediasize + "px)");
            if (screensize.matches) {
                return true;
            } else {
                return false;
            }
        } else {
            if ($winW() <= mediasize) {
                return true;
            } else {
                return false;
            }
        }
    };
    $(document).ready(function() {
        $(window).on('load', function() {
            $('.preloader').fadeOut();
            $('.animated-row').each(function() {
                var $this = $(this);
                $this.find('.animate').each(function(i) {
                    var $item = $(this);
                    var animation = $item.data('animate');
                    $item.on('inview', function(event, isInView) {
                        if (isInView) {
                            setTimeout(function() {
                                $item.addClass('animated ' + animation).removeClass('animate');
                            }, i * 50);
                        } else if (!screencheck(767)) {
                            $item.removeClass('animated ' + animation).addClass('animate');
                        }
                    });
                });
            });
        });
        if ($('.facts-list').length) {
            $('.facts-list').owlCarousel({
                loop: true,
                nav: false,
                dots: true,
                items: 3,
                margin: 30,
                autoplay: false,
                smartSpeed: 700,
                autoplayTimeout: 6000,
                responsive: {
                    0: {
                        items: 1,
                        margin: 0
                    },
                    460: {
                        items: 1,
                        margin: 0
                    },
                    576: {
                        items: 2,
                        margin: 20
                    },
                    992: {
                        items: 3,
                        margin: 30
                    }
                }
            });
        }
        if ($('.services-list').length) {
            $('.services-list').owlCarousel({
                loop: true,
                nav: false,
                dots: true,
                items: 3,
                margin: 30,
                autoplay: false,
                smartSpeed: 700,
                autoplayTimeout: 6000,
                responsive: {
                    0: {
                        items: 1,
                        margin: 0
                    },
                    460: {
                        items: 1,
                        margin: 0
                    },
                    576: {
                        items: 2,
                        margin: 20
                    },
                    992: {
                        items: 3,
                        margin: 30
                    }
                }
            });
        }
        if ($('.gallery-list').length) {
            $('.gallery-list').owlCarousel({
                loop: false,
                nav: false,
                dots: true,
                items: 3,
                autoplay: true,
                smartSpeed: 700,
                autoplayTimeout: 4000,
                responsive: {
                    0: {
                        items: 1,
                        margin: 0
                    },
                    576: {
                        items: 2,
                        margin: 20
                    },
                    992: {
                        items: 3,
                        margin: 30
                    }
                }
            });
        }
        if ($('.testimonials-slider').length) {
            $('.testimonials-slider').owlCarousel({
                loop: true,
                nav: false,
                dots: true,
                items: 1,
                margin: 30,
                autoplay: true,
                smartSpeed: 700,
                autoplayTimeout: 6000,
                responsive: {
                    0: {
                        items: 1,
                        margin: 0
                    },
                    768: {
                        items: 1
                    }
                }
            });
        }
        if ($('.fullpage-default').length) {
            var myFullpage = new fullpage('.fullpage-default', {
                licenseKey: ' C7F41B00-5E824594-9A5EFB99-B556A3D5',
                anchors: ['slide01', 'slide02', 'slide03', 'slide04', 'slide05', 'slide06', 'slide07', 'slide08', 'slide09'],
                menu: '#nav',
                lazyLoad: true,
                navigation: true,
                navigationPosition: 'right',
                scrollOverflow: true,
                responsiveWidth: 768,
                responsiveHeight: 600,
                responsiveSlides: true,
                scrollingSpeed: 900,
                afterLoad: function(origin, destination) {
                    var header = document.getElementById('header');
                    if (header && destination && destination.index > 0) {
                        header.classList.add('header-scrolled');
                    } else if (header) {
                        header.classList.remove('header-scrolled');
                    }
                    if (window.PortfolioMotion && destination && destination.item) {
                        window.PortfolioMotion.activateSlide(destination.item);
                    }
                },
                afterRender: function() {
                    var first = document.querySelector('.fullpage-default .section');
                    if (window.PortfolioMotion && first) {
                        window.PortfolioMotion.activateSlide(first);
                    }
                }
            });
        }
        $(document).on('click', '.navbar-toggle', function() {
            $('.navbar-collapse').slideToggle(300);
            return false;
        }).on('click', '.navigation-menu > li > a', function() {
            $('.navbar-collapse').slideUp(300);
        }).on('click', '.next-section', function() {
            fullpage_api.moveSectionDown();
        });
        $('.facts-row').on('inview', function(event, isInView) {
            $('.count-number').each(function() {
                $(this).prop('Counter', 0).animate({
                    Counter: $(this).text()
                }, {
                    duration: 1000,
                    easing: 'swing',
                    step: function(now) {
                        $(this).text(Math.ceil(now));
                    }
                });
                setTimeout(function() {
                    $('.count-number').removeClass('count-number').addClass('counted');
                }, 1000);
            });
        });
        $('.skills-row').on('inview', function(event, isInView) {
            $(this).addClass('view');
        });
        $(document).on('click', '.menu-trigger', function() {
            $('body').toggleClass('sidemenu-open');
        }).on('click', '.side-menu .navbar-nav li a', function() {
            $('body').removeClass('sidemenu-open');
        });

        (function updateLeetCodeCount() {
            var $count = $('#leetcode-count');
            var $stat = $('#leetcode-stat');
            var $divider = $('#leetcode-divider');
            if (!$count.length || !$stat.length) return;

            var username = 'jayakrishnanvr98';
            var endpoints = [
                'https://leetcode-stats.tashif.codes/' + username,
                'https://leetcode-api-faisalshohag.vercel.app/' + username,
                'https://alfa-leetcode-api.onrender.com/' + username + '/solved'
            ];

            function showCount(n) {
                if (typeof n !== 'number' || n <= 0) return;
                $count.text(n);
                $stat.removeAttr('hidden');
                $divider.removeAttr('hidden');
            }

            function fetchFrom(index) {
                if (index >= endpoints.length) return;
                fetch(endpoints[index])
                    .then(function(res) {
                        if (!res.ok) throw new Error('bad status');
                        return res.json();
                    })
                    .then(function(data) {
                        var n = data.totalSolved || data.solvedProblem;
                        if (typeof n === 'number' && n > 0) {
                            showCount(n);
                        } else {
                            fetchFrom(index + 1);
                        }
                    })
                    .catch(function() {
                        fetchFrom(index + 1);
                    });
            }

            fetchFrom(0);
        })();
    });
})(jQuery, window, document);