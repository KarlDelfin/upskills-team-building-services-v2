import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import MotionPathPlugin from 'gsap/MotionPathPlugin'
import SplitText from 'gsap/SplitText'
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin'
import DrawSVGPlugin from 'gsap/DrawSVGPlugin'

import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin)  

/* LENIS SCROLL */
const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

export function initHeaderAnimations() {
    /* HEADER */
    /* let mm = gsap.matchMedia();

    mm.add("(min-width: 801px)", () => {
        ScrollTrigger.create({
            start: "top top",
            end: "max",
            onUpdate: (self) => {
                if (self.direction === 1) {
                    gsap.to(".header_con", {
                        yPercent: -200,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                } else {
                    gsap.to(".header_con", {
                        yPercent: 0,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                }
            }
        });
    }); */

    const headerTextsST = new SplitText(['header p', 'nav ul li a'], {
        type: 'lines',
    })

    gsap.timeline().from(headerTextsST.lines, {
        y: 50,
        opacity: 0,
        ease: 'back.out',
        stagger: { each: 0.1 },
    })

    gsap.from('.comp_logo', {
        y: -200,
        delay: .5,
    })
    
}

export function initHomeAnimations() {
    /* BANNER */
    gsap.from('.banner_con img', {
        scale: 1.3,
        duration: 3,
        ease: 'power4.out',
    })

    const bannerTextsST = new SplitText(['.banner_info p'], {
        type: 'lines',
    })
    gsap.timeline().from(bannerTextsST.lines, {
        y: 50,
        opacity: 0,
        ease: 'back.out',
        stagger: { each: 0.1 },
    })
    gsap.from('.banner_scroll', {
        opacity: 0,
        duration: 1,
        delay: 0.8,
    })

    gsap.timeline({
        scrollTrigger: { trigger: '#banner', start: 'top top', end: 'bottom top', scrub: true },
    }).to('.banner_con img', { objectPosition: '50% 100%' })

    /* MIDDLE */
    gsap.timeline({
        scrollTrigger: { trigger: '#middle', start: 'top bottom', end: 'bottom top', scrub: true },
    }).to('.middle_img img', { objectPosition: '50% 100%' })

    const middleTextsST = new SplitText(['.middle_con h2', '.middle_con p'], {
        type: 'lines',
    })

    gsap.timeline({
        scrollTrigger: { trigger: '.middle_con', start: 'top 75%' },
    }).from(middleTextsST.lines, {
        y: 50,
        opacity: 0,
        ease: 'back.out',
        stagger: { each: 0.1 },
    })

    /* SERVICES */
    gsap.timeline({
        scrollTrigger: { trigger: '.services_head', start: 'top 75%' },
    }).from('.services_head h2', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out',
        stagger: 0.15,
    }).from('.services_head p', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out',
        stagger: 0.15,
    }, 0)

    gsap.from('.bootcamp_card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out',
        stagger: 0.15,
        scrollTrigger: { trigger: '.pathway', start: 'top 75%' },
    })

    /* MAIN */
    const mainTextsST = new SplitText(
        ['.founded_info section h3', '.founded_info section p', '.foundational_guiding h2', '.foundational_guiding p', '.foundational_guiding ul'],
        { type: 'lines' }
    )
    gsap.from(mainTextsST.lines, {
        y: 50,
        opacity: 0,
        ease: 'back.out',
        stagger: { each: 0.08 },
        scrollTrigger: { trigger: '.main_con', start: 'top 70%' },
    })
    gsap.to('.pathway_line path', {
        drawSVG: '100%',
        duration: 1.5,
        ease: 'none',
        scrollTrigger: { trigger: '.foundational_guiding', start: 'top 60%', end: 'bottom 80%', scrub: true },
    })

    /* GALLERY */
    let galleryImages = gsap.utils.toArray('.gallery_con img');

    let galleryTL = gsap.timeline({
        scrollTrigger: { 
            trigger: ".gallery_con", 
            start: "top top", 
            end: "+=3000",
            scrub: true, 
            pin: true 
        }
    });

    galleryImages.forEach((image, i) => {
        const angle = (i / galleryImages.length) * Math.PI * 2;

        galleryTL.to(image, {
            x: Math.cos(angle) * 650,
            y: Math.sin(angle) * 250,
            rotation: 'random(-10, 10)',
            scale: 1,
            duration: 1.5,
            ease: "expo.out",
        }, 0);
    });

    galleryTL.from('.gallery_con p', {
        opacity: 0,
        scale: 0,
        duration: 1.5,
        ease: "power2.out"
    }, 0);

    const rotationTracker = { angle: 0 };

    galleryTL.to(rotationTracker, {
        angle: Math.PI * 2,
        duration: 3,
        ease: "sine.inOut",
        onUpdate: () => {
            galleryImages.forEach((image, i) => {
                const baseAngle = (i / galleryImages.length) * Math.PI * 2;
                const totalAngle = baseAngle + rotationTracker.angle;

                gsap.set(image, {
                    x: Math.cos(totalAngle) * 650,
                    y: Math.sin(totalAngle) * 250
                });
            });
        }
    }, 1.5);

    /* TEAM */
    gsap.from('.team_head h2', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out',
        stagger: 0.2,
        scrollTrigger: { trigger: '.team_head h2', start: 'top 75%' },
    })
    gsap.from('.team_card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out',
        stagger: 0.2,
        scrollTrigger: { trigger: '.team_card', start: 'top 75%' },
    })

    
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 100);
}

export function initFooterAnimations() {
    /* FOOTER */
    gsap.to('#contact', {
        width: '97%',
        scrollTrigger: { trigger: '#contact', start: 'top 90%', end: 'bottom bottom', scrub: true },
    })
    gsap.from('.footer_cta h2, .footer_link', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: { trigger: '#contact', start: 'top 80%',  },
    })
}

export function initSlidesPinning() {
    
    var panels = gsap.utils.toArray(".packages_con");
    panels.pop();

    panels.forEach((panel, i) => {
        let innerpanel = panel.querySelector(".packages_inner");
        let panelHeight = innerpanel.offsetHeight;
        let windowHeight = window.innerHeight;
        let difference = panelHeight - windowHeight;
        let fakeScrollRatio = difference > 0 ? (difference / (difference + windowHeight)) : 0;
        
        if (fakeScrollRatio) {
            panel.style.marginBottom = panelHeight * fakeScrollRatio + "px";
        }
        
        let tl = gsap.timeline({
            scrollTrigger:{
                trigger: panel,
                start: "bottom bottom",
                end: () => fakeScrollRatio ? `+=${innerpanel.offsetHeight}` : "bottom top",
                pinSpacing: false,
                pin: true,
                scrub: true,
            }
        });
        
        if (fakeScrollRatio) {
            tl.to(innerpanel, {yPercent:-100, y: window.innerHeight, duration: 1 / (1 - fakeScrollRatio) - 1, ease: "none"});
        }
        tl.fromTo(panel, {scale:1, opacity:1}, {scale: 0.7, opacity: 0.5, duration: 0.9})
        .to(panel, {opacity:0, duration: 0.1});
    });
}

export function initMobileMenu() {
    let isOpen = false;
    let exitSpeed = 1.5;
    let tl;
    let enterEndTime = 0;


    function er(val) {
        return isOpen = !isOpen
    }

    function init() {
        tl && tl.revert();

        gsap.set("#nav_mobile", {
            visibility: "hidden"
        });
        gsap.set(".nav_bg", {
            opacity: 0
        });

        tl = gsap
            .timeline({
                paused: true
            })

            .set("#nav_mobile", {
                visibility: "visible",
                pointerEvents: "auto"
            })
            .set('.bar-mid', {
                visibility: 'hidden'
            })
          
            // ═══ ENTER ═══

            .to(
                ".nav_bg", {
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out",
                    easeReverse: er("power4.out")
                },
                0
            )

            .fromTo(".nav_panel", {
                x: "110%",
                y: 0,
                rotation: 0
            }, {
                x: "0%",
                y: 0,
                duration: 0.6,
                ease: "back.out",
                easeReverse: er("power3.in"),
                stagger: 0.1,
            }, 0)

            .fromTo( ".nav_item", {
                opacity: 0,
                x: -20
            }, {
                opacity: 1,
                x: 0,
                duration: 1.2,
                ease: "expo.out",
                easeReverse: er("power3.in"),
                stagger: 0.03
            },0.1)

            .fromTo(".bar-top", {
                stroke: "var(--defaultColor)",
                attr: {
                    x1: 3,
                    y1: 7,
                    x2: 17,
                    y2: 7
                }
            }, {
                stroke: "var(--defaultColor)",
                attr: {
                    x1: 5,
                    y1: 5,
                    x2: 15,
                    y2: 15
                },
                duration: 0.35,
                ease: "back.out(1.4)",
                easeReverse: er("power3.out")
            }, 0.06 )
            .fromTo(".bar-bot", {
                stroke: "var(--defaultColor)",
                attr: {
                    x1: 3,
                    y1: 13,
                    x2: 17,
                    y2: 13
                }
            }, {
                stroke: "var(--defaultColor)",
                attr: {
                    x1: 15,
                    y1: 5,
                    x2: 5,
                    y2: 15
                },
                duration: 0.35,
                ease: "back.out(1.4)",
                easeReverse: er("power3.out")
            }, 0.06).addPause();

        enterEndTime = tl.duration();


        tl.to(".bar", {
            stroke: "var(--defaultColor)",
            duration: 0.2
        }).to(".bar-top", {
            attr: {
                x1: 3,
                y1: 7,
                x2: 17,
                y2: 7
            },
            duration: 0.2,
            ease: "power3.in"
        },"<")
        
        .to(".bar-bot", {
                attr: {
                    x1: 3,
                    y1: 13,
                    x2: 17,
                    y2: 13
                },
                duration: 0.2,
                ease: "power3.in"
            },
            "<"
        )

        // panels fall
        .to(".nav_panel", {
                y: "110vh",
                rotation: "random(-25, 25)",
                duration: 1,
                ease: "power3.in",
                stagger: {
                    from: "end",
                    each: 0.02
                }
            },"<")

        // bg fades
        .to(".nav_bg", {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in"
            }, "<0.1")

        .set("#nav_mobile", {
            visibility: "hidden",
            pointerEvents: "none"
        })
        .set('.bar-mid', {
            visibility: 'visible'
        })
            
            
    }
    init();

    function toggle() {
        isOpen = !isOpen;
        const btn = document.getElementById("menu_toggle");
        btn.setAttribute("aria-expanded", isOpen);
        btn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");

        if (isOpen) {
            if (tl.time() >= enterEndTime) {
                tl.timeScale(1).restart();
            } else {
                tl.timeScale(1).play();
            }
        } else {
            if (tl.time() < enterEndTime) {
                tl.timeScale(exitSpeed).reverse();
            } else {
                tl.timeScale(1).play();
            }
        }
    }

    document.getElementById("menu_toggle").addEventListener("click", toggle);
    document.querySelector(".nav_bg").addEventListener("click", () => {
        if (isOpen) toggle();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
            toggle();
            document.getElementById("menu_toggle").focus();
        }
    });
}