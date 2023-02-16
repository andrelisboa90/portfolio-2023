/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
    const mapNumber = (X,A,B,C,D) => (X-A)*(D-C)/(B-A)+C;
    // from http://www.quirksmode.org/js/events_properties.html#position
	const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY) {
            posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
        return { x : posx, y : posy }
    }
    // Generate a random float.
    const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

    /**
     * One class per effect. 
     * Lots of code is repeated, so that single effects can be easily used. 
     */

    
    // Effect 3
    class HoverImgFx3 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.style.overflow = 'hidden';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealImg = this.DOM.revealInner.querySelector('.hover-reveal__img');
            charming(this.DOM.el);
            this.DOM.letters = [...this.DOM.el.querySelectorAll('span')];
            this.initEvents();
        }
        initEvents() {
            this.positionElement = (ev) => {
                const mousePos = getMousePos(ev);
                const docScrolls = {
                    left : document.body.scrollLeft + document.documentElement.scrollLeft, 
                    top : document.body.scrollTop + document.documentElement.scrollTop
                };
                this.DOM.reveal.style.top = `${mousePos.y+20-docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x+20-docScrolls.left}px`;
            };
            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.showImage();
                this.animateLetters();
            };
            this.mousemoveFn = ev => requestAnimationFrame(() => {
                this.positionElement(ev);
            });
            this.mouseleaveFn = () => {
                this.hideImage();
            };
            
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
        }
        showImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .add('begin')
            .set([this.DOM.revealInner, this.DOM.revealImg], {transformOrigin: '50% 100%'})
            .add(new TweenMax(this.DOM.revealInner, 0.4, {
                ease: Expo.easeOut,
                startAt: {x: '50%', y: '120%', rotation: 50},
                x: '0%',
                y: '0%',
                rotation: 0
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.4, {
                ease: Expo.easeOut,
                startAt: {x: '-50%', y: '-120%', rotation: -50},
                x: '0%',
                y: '0%',
                rotation: 0
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.7, {
                ease: Expo.easeOut,
                startAt: {scale: 2},
                scale: 1
            }), 'begin');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);

            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add('begin')
            .add(new TweenMax(this.DOM.revealInner, 0.6, {
                ease: Expo.easeOut,
                y: '-120%',
                rotation: -5
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.6, {
                ease: Expo.easeOut,
                y: '120%',
                rotation: 5,
                scale: 1.2
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.2, {
                ease: Expo.easeOut,
                startAt: {x: '100%'},
                x: '0%',
                opacity: 1
            }, 0.03);
        }
    }

    
    [...document.querySelectorAll('[data-fx="1"] > a, a[data-fx="1"]')].forEach(link => new HoverImgFx1(link));
    [...document.querySelectorAll('[data-fx="2"] > a, a[data-fx="2"]')].forEach(link => new HoverImgFx2(link));
    [...document.querySelectorAll('[data-fx="3"] > a, a[data-fx="3"]')].forEach(link => new HoverImgFx3(link));
    [...document.querySelectorAll('[data-fx="4"] > a, a[data-fx="4"]')].forEach(link => new HoverImgFx4(link));
    [...document.querySelectorAll('[data-fx="5"] > a, a[data-fx="5"]')].forEach(link => new HoverImgFx5(link));
    [...document.querySelectorAll('[data-fx="6"] > a, a[data-fx="6"]')].forEach(link => new HoverImgFx6(link));
    [...document.querySelectorAll('[data-fx="7"] > a, a[data-fx="7"]')].forEach(link => new HoverImgFx7(link));
    [...document.querySelectorAll('[data-fx="8"] > a, a[data-fx="8"]')].forEach(link => new HoverImgFx8(link));
    [...document.querySelectorAll('[data-fx="9"] > a, a[data-fx="9"]')].forEach(link => new HoverImgFx9(link));
    [...document.querySelectorAll('[data-fx="10"] > a, a[data-fx="10"]')].forEach(link => new HoverImgFx10(link));
    [...document.querySelectorAll('[data-fx="11"] > a, a[data-fx="11"]')].forEach(link => new HoverImgFx11(link));
    [...document.querySelectorAll('[data-fx="12"] > a, a[data-fx="12"]')].forEach(link => new HoverImgFx12(link));
    [...document.querySelectorAll('[data-fx="13"] > a, a[data-fx="13"]')].forEach(link => new HoverImgFx13(link));
    [...document.querySelectorAll('[data-fx="14"] > a, a[data-fx="14"]')].forEach(link => new HoverImgFx14(link));
    [...document.querySelectorAll('[data-fx="15"] > a, a[data-fx="15"]')].forEach(link => new HoverImgFx15(link));
    [...document.querySelectorAll('[data-fx="16"] > a, a[data-fx="16"]')].forEach(link => new HoverImgFx16(link));
    [...document.querySelectorAll('[data-fx="17"] > a, a[data-fx="17"]')].forEach(link => new HoverImgFx17(link));
    [...document.querySelectorAll('[data-fx="18"] > a, a[data-fx="18"]')].forEach(link => new HoverImgFx18(link));
    [...document.querySelectorAll('[data-fx="19"] > a, a[data-fx="19"]')].forEach(link => new HoverImgFx19(link));
    [...document.querySelectorAll('[data-fx="20"] > a, a[data-fx="20"]')].forEach(link => new HoverImgFx20(link));
    [...document.querySelectorAll('[data-fx="21"] > a, a[data-fx="21"]')].forEach(link => new HoverImgFx21(link));
    [...document.querySelectorAll('[data-fx="22"] > a, a[data-fx="22"]')].forEach(link => new HoverImgFx22(link));
    [...document.querySelectorAll('[data-fx="23"] > a, a[data-fx="23"]')].forEach(link => new HoverImgFx23(link));

    // Demo purspose only: Preload all the images in the page..
    const contentel = document.querySelector('.content');
    [...document.querySelectorAll('.block__title, .block__link, .content__text-link')].forEach((el) => {
        const imgsArr = el.dataset.img.split(',');
        for (let i = 0, len = imgsArr.length; i <= len-1; ++i ) {
            const imgel = document.createElement('img');
            imgel.style.visibility = 'hidden';
            imgel.style.width = 0;
            imgel.src = imgsArr[i];
            imgel.className = 'preload';
            contentel.appendChild(imgel);
        }
    });
}
