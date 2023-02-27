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
	// Calculates the offsetTop or offsetLeft of an element relative to the viewport 
	// (not counting with any transforms the element might have)
	const getOffset = (elem, axis) => {
		let offset = 0;
		const type = axis === 'top' ? 'offsetTop' : 'offsetLeft';
		do {
			if ( !isNaN( elem[type] ) )
			{
				offset += elem[type];
			}
		} while( elem = elem.offsetParent );
		return offset;
	}
	// Calculates the distance between two points.
	const distance = (p1,p2) => Math.hypot(p2.x-p1.x, p2.y-p1.y);
	// Generates a random number.
	const randNumber = (min,max) => Math.floor(Math.random() * (max - min + 1)) + min;
	// Gets the mouse position. From http://www.quirksmode.org/js/events_properties.html#position
	const getMousePos = (e) => {
		let posx = 0;
		let posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
	};
	// Returns the rotation angle of an element.
	const getAngle = (el) => {
		const st = window.getComputedStyle(el, null);
		const tr = st.getPropertyValue('transform');
		let values = tr.split('(')[1];
		values = values.split(')')[0];
		values = values.split(',');
		return Math.round(Math.asin(values[1]) * (180/Math.PI));
	};
	// Scroll control functions. Taken from https://stackoverflow.com/a/4770179.
	const keys = {37: 1, 38: 1, 39: 1, 40: 1};
	const preventDefault = (e) => {
		e = e || window.event;
		if (e.preventDefault)
			e.preventDefault();
		e.returnValue = false;  
	}
	const preventDefaultForScrollKeys = (e) => {
		if (keys[e.keyCode]) {
			preventDefault(e);
			return false;
		}
	}
	const disableScroll = () => {
		if (window.addEventListener) // older FF
			window.addEventListener('DOMMouseScroll', preventDefault, false);
		window.onwheel = preventDefault; // modern standard
		window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
		window.ontouchmove  = preventDefault; // mobile
		document.onkeydown  = preventDefaultForScrollKeys;
	}
	const enableScroll = () => {
		if (window.removeEventListener)
			window.removeEventListener('DOMMouseScroll', preventDefault, false);
		window.onmousewheel = document.onmousewheel = null; 
		window.onwheel = null; 
		window.ontouchmove = null;  
		document.onkeydown = null;  
	}
	
	// The GridItem class.
    class GridItem {
        constructor(el) {
			this.DOM = {el: el};
			this.URL = this.DOM.el.href;
			// The rectangle element around the image.
			this.DOM.bg = this.DOM.el.querySelector('.grid__item-bg');
			// The following DOM elements are elements that will move/tilt when hovering the item.
			this.DOM.tilt = {};
			// The image.
			this.DOM.imgWrap = this.DOM.el.querySelector('.grid__item-wrap');
			this.DOM.tilt.img = this.DOM.imgWrap.querySelector('img');
			// The title (vertical text).
			this.DOM.tilt.title = this.DOM.el.querySelector('.grid__item-title');
			// The number (horizontal letter/number code).
			this.DOM.tilt.number = this.DOM.el.querySelector('.grid__item-number');
			// Split the number into spans using charming.js
			charming(this.DOM.tilt.number);
			// And access the spans/letters.
			this.DOM.numberLetters = this.DOM.tilt.number.querySelectorAll('span');
			// Configuration for when moving/tilting the elements on hover.
			this.tiltconfig = {   
                title: {translation : {x: [-8,8], y: [4,-4]}},
                number: {translation : {x: [-5,5], y: [-10,10]}},
                img: {translation : {x: [-15,15], y: [-10,10]}}
			};
			// Get the rotation angle value of the image element.
			// This will be used to rotate the DOM.bg to the same value when expanding/opening the item.
			this.angle = getAngle(this.DOM.tilt.img);
			// Init/Bind events.
            this.initEvents();
		}
		initEvents() {
			/**
			 * Mouseenter: 
			 * - Scale up the DOM.bg element.
			 * - Animate the number letters.
			 * 
			 * Mousemove: 
			 * - tilt - move both the number, image and title elements. 
			 * 
			 * 
			 * Mouseleave: 
			 * - Scale down the DOM.bg element.
			 * - Animate the number letters.
			 */
			this.toggleAnimationOnHover = (type) => {
				// Scale up the bg element.
				TweenMax.to(this.DOM.bg, 1, {
					ease: Expo.easeOut,
					scale: type === 'mouseenter' ? 1.15 : 1
				});
				// Animate the number letters.
				this.DOM.numberLetters.forEach((letter,pos) => {
					TweenMax.to(letter, .2, {
						ease: Quad.easeIn,
						delay: pos*.1,
						y: type === 'mouseenter' ? '-50%' : '50%',
						opacity: 0,
						onComplete: () => {
							TweenMax.to(letter, type === 'mouseenter' ? 0.6 : 1, {
								ease: type === 'mouseenter' ? Expo.easeOut : Elastic.easeOut.config(1,0.4),
								startAt: {y: type === 'mouseenter' ? '70%' : '-70%', opacity: 0},
								y: '0%',
								opacity: 1
							});
						}
					});
				});
			};
			this.mouseenterFn = (ev) => {
				if ( !allowTilt ) return;
				this.toggleAnimationOnHover(ev.type);
            };
            this.mousemoveFn = (ev) => requestAnimationFrame(() => {
				if ( !allowTilt ) return;
                this.tilt(ev);
            });
            this.mouseleaveFn = (ev) => {
				if ( !allowTilt ) return;
				this.resetTilt();
				this.toggleAnimationOnHover(ev.type);
            };
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
		}
		tilt(ev) {
			// Get mouse position.
			const mousepos = getMousePos(ev);
            // Document scrolls.
            const docScrolls = {left : body.scrollLeft + docEl.scrollLeft, top : body.scrollTop + docEl.scrollTop};
            const bounds = this.DOM.el.getBoundingClientRect();
            // Mouse position relative to the main element (this.DOM.el).
            const relmousepos = {
                x : mousepos.x - bounds.left - docScrolls.left, 
                y : mousepos.y - bounds.top - docScrolls.top 
            };
            // Movement settings for the tilt elements.
            for (let key in this.DOM.tilt) {
				let t = this.tiltconfig[key].translation;
				// Animate each of the elements..
                TweenMax.to(this.DOM.tilt[key], 2, {
                    ease: Expo.easeOut,
                    x: (t.x[1]-t.x[0])/bounds.width*relmousepos.x + t.x[0],
                    y: (t.y[1]-t.y[0])/bounds.height*relmousepos.y + t.y[0]
                });
            }
		}
		resetTilt() {
			for (let key in this.DOM.tilt ) {
                TweenMax.to(this.DOM.tilt[key], 2, {
					ease: Elastic.easeOut.config(1,0.4),
                    x: 0,
                    y: 0
                });
            }
		}
		/**
		 * Hides the item:
		 * - Scales down and fades out the image and bg elements.
		 * - Moves down and fades out the title and number elements.
		 */
		hide(withAnimation = true) { this.toggle(withAnimation,false); }
		/**
		 * Resets.
		 */
		show(withAnimation = true) { this.toggle(withAnimation); }
		toggle(withAnimation, show = true) {
			TweenMax.to(this.DOM.tilt.img, withAnimation ? 0.8 : 0, {
				ease: Expo.easeInOut,
				delay: !withAnimation ? 0 : show ? 0.15 : 0,
				scale: show ? 1 : 0,
				opacity: show ? 1 : 0,
			});
			TweenMax.to(this.DOM.bg, withAnimation ? 0.8 : 0, {
				ease: Expo.easeInOut,
				delay: !withAnimation ? 0 : show ? 0 : 0.15,
				scale: show ? 1 : 0,
				opacity: show ? 1 : 0
			});
			this.toggleTexts(show ? 0.45 : 0, withAnimation, show);
		}
		// hides the texts (translate down and fade out).
		hideTexts(delay = 0, withAnimation = true) { this.toggleTexts(delay, withAnimation, false); }
		// shows the texts (reset transforms and fade in).
		showTexts(delay = 0, withAnimation = true) { this.toggleTexts(delay, withAnimation); }
		toggleTexts(delay, withAnimation, show = true) {
			TweenMax.to([this.DOM.tilt.title, this.DOM.tilt.number], !withAnimation ? 0 : show ? 1 : 0.5, {
				ease: show ? Expo.easeOut : Quart.easeIn,
				delay: !withAnimation ? 0 : delay,
				y: show ? 0 : 20,
				opacity: show ? 1 : 0
			});
		}
	}

	// The Content class. Represents one content item per grid item.
    class Content {
        constructor(el) {
			this.DOM = {el: el};
			// The content elements: image, title, subtitle and text.
            this.DOM.img = this.DOM.el.querySelector('.content__item-img');
            this.DOM.title = this.DOM.el.querySelector('.content__item-title');
            this.DOM.subtitle = this.DOM.el.querySelector('.content__item-subtitle');
			this.DOM.text = this.DOM.el.querySelector('.content__item-text');
			// Split the title into spans using charming.js
			charming(this.DOM.title);
			// And access the spans/letters.
			this.DOM.titleLetters = this.DOM.title.querySelectorAll('span');
			this.titleLettersTotal = this.DOM.titleLetters.length;
		}
		/**
		 * Show/Hide the content elements (title letters, the subtitle and the text).
		 */
        show(delay = 0, withAnimation = true) { this.toggle(delay, withAnimation); }
        hide(delay = 0, withAnimation = true) { this.toggle(delay, withAnimation, false); }
		toggle(delay, withAnimation, show = true) {
			setTimeout(() => {
				
				this.DOM.titleLetters.forEach((letter,pos) => {
					TweenMax.to(letter, !withAnimation ? 0 : show ? .6 : .3, {
						ease: show ? Back.easeOut : Quart.easeIn,
						delay: !withAnimation ? 0 : show ? pos*.05 : (this.titleLettersTotal-pos-1)*.04,
						startAt: show ? {y: '50%', opacity: 0} : null,
						y: show ? '0%' : '50%',
						opacity: show ? 1 : 0
					});
				});
				this.DOM.subtitle.style.opacity = show ? 1 : 0;
				this.DOM.text.style.opacity = show ? 1 : 0;

			}, withAnimation ? delay*1000 : 0 );
		}
    }

	// The Grid class.
    class Grid {
        constructor(el) {
			this.DOM = {el: el};
			// The grid wrap.
			this.DOM.gridWrap = this.DOM.el.parentNode;
			// The grid items.
            this.items = [];
            Array.from(this.DOM.el.querySelectorAll('.grid__item')).forEach(itemEl => this.items.push(new GridItem(itemEl)));
            // The total number of items.
			this.itemsTotal = this.items.length;
			// The content items.
			this.contents = [];
			Array.from(document.querySelectorAll('.content > .content__item')).forEach(contentEl => this.contents.push(new Content(contentEl)));
			// Back control and scroll indicator (elements shown when the item´s content is open).
			this.DOM.closeCtrl = document.querySelector('.content__close');
			this.DOM.scrollIndicator = document.querySelector('.content__indicator');
			// The open grid item.
			this.current = -1;
            // Init/Bind events.
            this.initEvents();
		}
		initEvents() {
			// Clicking a grid item hides all the other grid items (ordered by proximity to the clicked one) 
			// and expands/opens the clicked one.
			for (let item of this.items) {
				item.DOM.el.addEventListener('click', (ev) => {
					ev.preventDefault();
					this.openItem(item);
				});
			}
			// Close item.
			this.DOM.closeCtrl.addEventListener('click', () => this.closeItem());
			// (Incomplete! For now: if theres an open item, then show back the grid.
			this.resizeFn = () => {
				if (this.current === -1 || winsize.width === window.innerWidth) return;
				this.closeItem(false);
			};
			window.addEventListener('resize', this.resizeFn);
		}
		getSizePosition(el, scrolls = true) {
			const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    		const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
			return {
				width: el.offsetWidth,
				height: el.offsetHeight,
				left: scrolls ? getOffset(el, 'left')-scrollLeft : getOffset(el, 'left'),
				top: scrolls ? getOffset(el, 'top')-scrollTop : getOffset(el, 'top')
			};
		}
		openItem(item) {
			// Abrir na mesma aba
			// window.location.assign(item.URL);

			// Abrir em nova aba
			window.open(item.URL, '_blank').focus();
		}
		/**
		 * Toggle the content elements.
		 */
		showContentElems(contentEl, delay = 0, withAnimation = true) { this.toggleContentElems(contentEl, delay, withAnimation); }
		hideContentElems(contentEl, delay = 0, withAnimation = true) { this.toggleContentElems(contentEl, delay, withAnimation, false); }
		toggleContentElems(contentEl, delay, withAnimation, show = true) {
			// toggle the back control and scroll indicator.
			TweenMax.to([this.DOM.closeCtrl, this.DOM.scrollIndicator], withAnimation ? 0.8 : 0, {
				ease: show ? Expo.easeOut : Expo.easeIn,
				delay: withAnimation ? delay : 0,
				startAt: show ? {y: 60} : null,
				y: show ? 0 : 60,
				opacity: show ? 1 : 0
			});
			if ( show ) {
				contentEl.show(delay, withAnimation);
			}
			else {
				contentEl.hide(delay, withAnimation);
			}
		}
		// Based on https://stackoverflow.com/q/25481717
		sortByDist(refPoint, itemsArray) {
			let distancePairs = [];
			let output = [];
	
			for(let i in itemsArray) {
				const rect = itemsArray[i].DOM.el.getBoundingClientRect();
				distancePairs.push([distance(refPoint,{x:rect.left+rect.width/2, y:rect.top+rect.height/2}), i]);
			}
	
			distancePairs.sort((a,b) => a[0]-b[0]);
	
			for(let p in distancePairs) {
				const pair = distancePairs[p];
				output.push(itemsArray[pair[1]]);
			}
	
			return output;
		}
		/**
		 * Shows/Hides all the grid items except the "exclude" item.
		 * The items will be sorted based on the distance to the exclude item.
		 */
		showAllItems(exclude, withAnimation = true) { this.toggleAllItems(exclude, withAnimation); }
		hideAllItems(exclude, withAnimation = true) { this.toggleAllItems(exclude, withAnimation, false); }
		toggleAllItems(exclude, withAnimation, show = true) {
			if ( !withAnimation ) {
				this.items.filter(item => item != exclude).forEach((item, pos) => item[show ? 'show' : 'hide'](withAnimation));
			}
			else {
				const refrect = exclude.DOM.el.getBoundingClientRect(); 
				const refPoint = {
					x: refrect.left+refrect.width/2, 
					y: refrect.top+refrect.height/2
				};
				this.sortByDist(refPoint, this.items.filter(item => item != exclude))
					.forEach((item, pos) => setTimeout(() => item[show ? 'show' : 'hide'](), show ? 300+pos*70 : pos*70));
			}
		}
	}

	// Controls whether the item will have the "tilt" movement on hover (mousemove) or not.
	let allowTilt = true;
	
	// Caching some stuff..
	const body = document.body;
	const docEl = document.documentElement;
	
	// Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

	// Initialize the Grid.
	const grid = new Grid(document.querySelector('.grid'));

	// Preload images.
	imagesLoaded(document.querySelectorAll('.grid__item-img'), () => {
		body.classList.remove('loading');
		var msnry = new Masonry( grid.DOM.el, {
			// options
			itemSelector: '.grid__item',
			columnWidth: 260,
			gutter: 100,
			fitWidth: true
		});
	});
}




// Efeito cursos.
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

    // Effect 1
    class HoverImgFx1 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealImg = this.DOM.revealInner.querySelector('.hover-reveal__img');

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
            .add(new TweenMax(this.DOM.revealInner, 0.2, {
                ease: Sine.easeOut,
                startAt: {x: '-100%'},
                x: '0%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.2, {
                ease: Sine.easeOut,
                startAt: {x: '100%'},
                x: '0%'
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
            .add(new TweenMax(this.DOM.revealInner, 0.2, {
                ease: Sine.easeOut,
                x: '100%'
            }), 'begin')
            
            .add(new TweenMax(this.DOM.revealImg, 0.2, {
                ease: Sine.easeOut,
                x: '-100%'
            }), 'begin');
        }
    }

    // Effect 2
    class HoverImgFx2 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealImg = this.DOM.revealInner.querySelector('.hover-reveal__img');

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
            .add(new TweenMax(this.DOM.revealInner, 0.4, {
                ease: Quint.easeOut,
                startAt: {x: '-100%', y: '-100%'},
                x: '0%',
                y: '0%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.4, {
                ease: Quint.easeOut,
                startAt: {x: '100%', y: '100%'},
                x: '0%',
                y: '0%'
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
            .add(new TweenMax(this.DOM.revealInner, 0.3, {
                ease: Quint.easeOut,
                x: '100%',
                y: '100%'
            }), 'begin')
            
            .add(new TweenMax(this.DOM.revealImg, 0.3, {
                ease: Quint.easeOut,
                x: '-100%',
                y: '-100%'
            }), 'begin');
        }
    }

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

    // Effect 4
    class HoverImgFx4 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
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
            .add(new TweenMax(this.DOM.revealInner, 0.8, {
                ease: Expo.easeOut,
                startAt: {opacity: 0, y: '50%', rotation: -15, scale:0},
                y: '0%',
                rotation: 0,
                opacity: 1,
                scale: 1
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.8, {
                ease: Expo.easeOut,
                startAt: {rotation: 15, scale: 2},
                rotation: 0,
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
            .add(new TweenMax(this.DOM.revealInner, 0.15, {
                ease: Sine.easeOut,
                y: '-40%',
                rotation: 10,
                scale: 0.9,
                opacity: 0
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.15, {
                ease: Sine.easeOut,
                rotation: -10,
                scale: 1.5
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.8, {
                ease: Expo.easeOut,
                startAt: {y: '50%'},
                y: '0%',
                opacity: 1
            }, 0.03);
        }
    }

    // Effect 5
    class HoverImgFx5 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
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
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealInner, {opacity: 0})
            .add('begin')
            .add(new TweenMax(this.DOM.revealDeco, 0.8, {
                ease: Expo.easeOut,
                startAt: {opacity: 0, scale: 0, rotation: 35},
                opacity: 1,
                scale: 1,
                rotation: 0
            }), 'begin')
            .add(new TweenMax(this.DOM.revealInner, 0.8, {
                ease: Expo.easeOut,
                startAt: {scale: 0, rotation: 35},
                rotation: 0,
                scale: 1,
                opacity: 1
            }), 'begin+=0.15')
            .add(new TweenMax(this.DOM.revealImg, 0.8, {
                ease: Expo.easeOut,
                startAt: {rotation: -35, scale: 2},
                rotation: 0,
                scale: 1
            }), 'begin+=0.15')
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

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
            .add(new TweenMax([this.DOM.revealDeco, this.DOM.revealInner], 0.2, {
                ease: Expo.easeOut,
                opacity: 0,
                scale: 0.9
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.1, {
                ease: Expo.easeOut,
                startAt: {y: '50%'},
                y: '0%',
                opacity: 1
            }, 0.06);
        }
    }

    // Effect 6
    class HoverImgFx6 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.style.overflow = 'hidden';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
            this.DOM.revealImg = this.DOM.revealInner.querySelector('.hover-reveal__img');

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
            TweenMax.killTweensOf(this.DOM.reveal);
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .add('begin')
            .set(this.DOM.revealInner, {x: '100%'})
            .set(this.DOM.revealDeco, {transformOrigin: '100% 50%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.3, {
                ease: Sine.easeInOut,
                startAt: {scaleX: 0},
                scaleX: 1
            }), 'begin')
            .set(this.DOM.revealDeco, {transformOrigin: '0% 50%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.6, {
                ease: Expo.easeOut,
                scaleX: 0
            }), 'begin+=0.3')
            .add(new TweenMax(this.DOM.revealInner, 0.6, {
                ease: Expo.easeOut,
                startAt: {x: '100%'},
                x: '0%'
            }), 'begin+=0.45')
            .add(new TweenMax(this.DOM.revealImg, 0.6, {
                ease: Expo.easeOut,
                startAt: {x: '-100%'},
                x: '0%'
            }), 'begin+=0.45')
            .add(new TweenMax(this.DOM.revealImg, 1.6, {
                ease: Expo.easeOut,
                startAt: {scale: 1.3},
                scale: 1
            }), 'begin+=0.45')
            .add(new TweenMax(this.DOM.reveal, 0.8, {
                ease: Quint.easeOut,
                startAt: {x: '20%', rotation: 10},
                x: '0%',
                rotation: 0
            }), 'begin');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.reveal);
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

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
            .add(new TweenMax(this.DOM.revealInner, 0.1, {
                ease: Sine.easeOut,
                x: '-100%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.1, {
                ease: Sine.easeOut,
                x: '100%'
            }), 'begin')
        }
    }
 
    // Effect 7
    class HoverImgFx7 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
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
            window.addEventListener('resize', () => this.rect = this.DOM.reveal.getBoundingClientRect());
        }
        showImage() {
            TweenMax.killTweensOf(this.DOM.reveal);
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .add('begin')
            .set(this.DOM.revealInner, {opacity: 0})
            .set(this.DOM.revealDeco, {transformOrigin: '-5% 50%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.2, {
                ease: Quad.easeInOut,
                startAt: {scaleX: 0},
                scaleX: 1,
                scaleY: 0.8
            }), 'begin')
            .set(this.DOM.revealDeco, {transformOrigin: '105% 50%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.3, {
                ease: Sine.easeOut,
                scaleX: 0,
                scaleY: 1
            }), 'begin+=0.2')
            .add(new TweenMax(this.DOM.revealInner, 0.9, {
                ease: Elastic.easeOut.config(1,0.6),
                startAt: {scale: 0, opacity: 1, x: '0%'},
                scale: 1,
            }), 'begin+=0.4')
            .add(new TweenMax(this.DOM.revealImg, 0.8, {
                ease: Expo.easeOut,
                rotation: -15,
            }), 'begin')
            .add(new TweenMax(this.DOM.reveal, 1.1, {
                ease: Quint.easeOut,
                startAt: {x: '-50%', y: '10%', rotation: -35},
                x: '0%',
                y: '0%',
                rotation: 15
            }), 'begin');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.reveal);
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealInner, 0.13, {
                ease: Sine.easeOut,
                scale: 0.8,
                opacity: 0
            }));
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.8, {
                ease: Elastic.easeOut.config(1,0.4),
                startAt: {y: '50%'},
                y: '0%',
                opacity: 1
            }, 0.02);
        }
    }

    // Effect 8
    class HoverImgFx8 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
            this.DOM.revealImg = this.DOM.revealInner.querySelector('.hover-reveal__img');
            this.rect = this.DOM.reveal.getBoundingClientRect();
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
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealInner, {opacity: 0})
            .add('begin')
            .set(this.DOM.revealDeco, {transformOrigin: '50% 0%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.6, {
                ease: Cubic.easeInOut,
                startAt: {opacity: 0, x: '15%', y: '50%', scaleY: 3},
                scaleY: 1,
                opacity: 1,
                y: '-15%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealInner, 0.8, {
                ease: Expo.easeOut,
                startAt: {y: '100%', rotation: 3},
                opacity: 1,
                rotation: 0,
                y: '0%'
            }), 'begin+=0.4')
            .add(new TweenMax(this.DOM.revealImg, 1.3, {
                ease: Expo.easeOut,
                startAt: {scale: 1.4},
                scale: 1
            }), 'begin+=0.4')
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

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
            .add(new TweenMax([this.DOM.revealDeco, this.DOM.revealInner], 0.2, {
                ease: Expo.easeOut,
                opacity: 0
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.1, {
                ease: Elastic.easeOut.config(1,0.4),
                startAt: {y: '50%'},
                y: '0%',
                opacity: 1
            }, 0.08);
        }
    }

    // Effect 9
    class HoverImgFx9 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
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
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set([this.DOM.revealInner, this.DOM.revealImg, this.DOM.revealDeco], {transformOrigin: '120% 0%'})
            .set(this.DOM.revealInner, {opacity: 0})
            .add('begin')
            .add(new TweenMax(this.DOM.revealDeco, 0.8, {
                ease: Expo.easeOut,
                startAt: {opacity: 0, rotation: -80, x: '15%', y: '60%'},
                opacity: 1,
                rotation: 0,
                y: '-15%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealInner, 0.8, {
                ease: Expo.easeOut,
                startAt: {x: '50%', y: '150%', rotation: -25},
                opacity: 1,
                x: '0%',
                y: '0%',
                rotation: 0
            }), 'begin+=0.25')

            
            .add(new TweenMax(this.DOM.revealImg, 0.8, {
                ease: Expo.easeOut,
                startAt: {y: '-150%', rotation: -25},
                y: '0%',
                rotation: 0
            }), 'begin+=0.25');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

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
            .add(new TweenMax([this.DOM.revealDeco, this.DOM.revealInner], 0.2, {
                ease: Expo.easeOut,
                opacity: 0
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.1, {
                ease: Expo.easeOut,
                opacity: 1
            }, 0.08);
        }
    }

    // Effect 10
    class HoverImgFx10 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
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
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealInner, {opacity: 0})
            .add('begin')
            .add(new TweenMax(this.DOM.revealDeco, 0.5, {
                ease: Expo.easeOut,
                startAt: {scale: 0, opacity: 1, rotation: -10},
                scale: 1.6,
                rotation: 0
            }), 'begin')
            .add(new TweenMax(this.DOM.revealDeco, 0.3, {
                ease: Sine.easeOut,
                opacity: 0
            }), 'begin+=0.2')
            .add(new TweenMax(this.DOM.revealInner, 0.6, {
                ease: Expo.easeOut,
                startAt: {scale: 0, opacity: 0, rotation: 10},
                scale: 1,
                opacity: 1,
                rotation: 0
            }), 'begin+=0.2');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealDeco);

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
            .add(new TweenMax([this.DOM.revealDeco, this.DOM.revealInner], 0.2, {
                ease: Expo.easeOut,
                opacity: 0,
                scale: 0.9
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.1, {
                ease: Expo.easeOut,
                opacity: 1
            }, 0.04);
        }
    }

    // Effect 11
    class HoverImgFx11 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.style.overflow = 'hidden';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__deco"></div><div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealDeco = this.DOM.reveal.querySelector('.hover-reveal__deco');
            TweenMax.set(this.DOM.revealDeco, {
                width: '1%',
                height: '100%',
                background: 'white',
                left: '50%'
            });
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
            TweenMax.killTweensOf(this.DOM.reveal);
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .add('begin')
            .set(this.DOM.revealInner, {y: '100%'})
            .set(this.DOM.revealDeco, {transformOrigin: '50% 100%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.3, {
                ease: Sine.easeInOut,
                startAt: {scaleY: 0, scaleX: 10},
                scaleY: 1,
                scaleX: 1
            }), 'begin')
            .set(this.DOM.revealDeco, {transformOrigin: '50% 0%'})
            .add(new TweenMax(this.DOM.revealDeco, 0.3, {
                ease: Expo.easeOut,
                scaleY: 0
            }), 'begin+=0.3')
            .add(new TweenMax(this.DOM.revealInner, 0.5, {
                ease: Expo.easeOut,
                startAt: {y: '100%'},
                y: '0%'
            }), 'begin+=0.4')
            .add(new TweenMax(this.DOM.revealImg, 0.5, {
                ease: Expo.easeOut,
                startAt: {y: '-100%'},
                y: '0%'
            }), 'begin+=0.4')
            .add(new TweenMax(this.DOM.revealImg, 0.5, {
                ease: Expo.easeOut,
                startAt: {y: '100%'},
                y: '0%'
            }), 'begin+=0.4')
            .add(new TweenMax(this.DOM.reveal, 1.1, {
                ease: Expo.easeOut,
                startAt: {y: '50%', rotation: 10},
                y: '0%',
                rotation: 0
            }), 'begin');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.reveal);
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDeco);

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
            .add(new TweenMax(this.DOM.revealInner, 0.1, {
                ease: Sine.easeOut,
                y: '-100%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.1, {
                ease: Sine.easeOut,
                y: '100%'
            }), 'begin')
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            TweenMax.set(this.DOM.letters, {opacity: 0});
            TweenMax.staggerTo(this.DOM.letters, 0.1, {
                ease: Expo.easeOut,
                startAt: {y: '50%'},
                y: '0%',
                opacity: 1
            }, 0.06);
        }
    }

    // Effect 12
    class HoverImgFx12 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal'; 
            this.totalDecos = 7;
            let inner = '';
            for (let i = 0; i <= this.totalDecos-1; ++i) {
                inner += '<div class="hover-reveal__deco"></div>';
            }
            inner += `<div class="hover-reveal__inner"><div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div></div>`
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealDecos = [...this.DOM.reveal.querySelectorAll('.hover-reveal__deco')];
            this.DOM.revealDecos.forEach((deco, pos) => {
                TweenMax.set(deco, {
                    width: pos === this.totalDecos-1 ? '100%' : `${getRandomFloat(40,100)}%`,
                    height: pos === this.totalDecos-1 ? '100%' : `${getRandomFloat(5,30)}%`,
                    x: pos === this.totalDecos-1 ? '0%' : `${getRandomFloat(-100,100)}%`,
                    y: pos === this.totalDecos-1 ? '0%' : `${getRandomFloat(-300,300)}%`,
                    scaleX: 0
                });
            });
            this.DOM.revealInner = this.DOM.reveal.querySelector('.hover-reveal__inner');
            this.DOM.revealInner.style.overflow = 'hidden';
            this.DOM.revealImg = this.DOM.revealInner.querySelector('.hover-reveal__img');

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
            TweenMax.killTweensOf(this.DOM.revealDecos);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .add('begin')
            .set(this.DOM.revealInner, {x: '100%', opacity: 0})
            .set(this.DOM.revealDecos, {transformOrigin: '100% 50%'})
            .staggerTo(this.DOM.revealDecos, 0.3, {
                ease: Expo.easeInOut,
                scaleX: 1
            }, 0.06, 'begin')
            .staggerTo(this.DOM.revealDecos, getRandomFloat(0.3,0.6), {
                ease: Expo.easeOut,
                startAt: {transformOrigin: '0% 50%'},
                scaleX: 0,
                x: '-=5%'
            }, 0.04, 'begin+=0.3')
            .add(new TweenMax(this.DOM.revealInner, 0.6, {
                ease: Expo.easeOut,
                startAt: {x: '100%'},
                x: '0%',
                opacity: 1
            }), 'begin+=0.75')
            .add(new TweenMax(this.DOM.revealImg, 0.6, {
                ease: Expo.easeOut,
                startAt: {x: '-100%'},
                x: '0%'
            }), 'begin+=0.75');
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealInner);
            TweenMax.killTweensOf(this.DOM.revealImg);
            TweenMax.killTweensOf(this.DOM.revealDecos);

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
            .add(new TweenMax(this.DOM.revealInner, 0.1, {
                ease: Sine.easeOut,
                x: '-100%'
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.1, {
                ease: Sine.easeOut,
                x: '100%'
            }), 'begin')
        }
    }

    // Effect 13
    class HoverImgFx13 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.style.zIndex = -1;
            this.totalImages = 3;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            charming(this.DOM.el);
            this.DOM.letters = [...this.DOM.el.querySelectorAll('span')];
            this.initEvents();
        }
        position() {
            this.rect = this.DOM.el.getBoundingClientRect();
            this.DOM.reveal.style.top = `${this.rect.top - this.DOM.reveal.offsetHeight/2}px`;
            this.DOM.reveal.style.left = `${this.rect.left - this.DOM.reveal.offsetWidth/2}px`;
        }
        initEvents() {
            this.mouseenterFn = () => {
                this.showImage();
                this.animateLetters();
            };
            this.mouseleaveFn = () => {
                this.hideImage();
            };
            
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
        }
        showImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.position();
            
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                }
            })
            .set([this.DOM.revealImgs], {opacity: 0})

            for (let i = 0; i <= this.totalImages-1; ++i) {
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], 0.7, {
                    ease: i === this.totalImages-1 ? Expo.easeOut : Quint.easeOut,
                    startAt: {x: '30%', y: '160%', rotation: i === this.totalImages-1 ? -30 : -10},
                    x: i === this.totalImages-1 ? '10%' : '-15%',
                    y: i === this.totalImages-1 ? '10%' : '-140%',
                    rotation: -10
                }), i*0.2);
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], 0.5, {
                    ease: Quad.easeOut,
                    startAt: {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0
                }), i*0.2);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onComplete: () => {
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                x: '-30%',
                y: '-240%',
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach(letter => TweenMax.set(letter, {
                y: Math.round(Math.random()) === 0 ? '100%' : '0%',
                opacity: 0
            }));
            TweenMax.to(this.DOM.letters, 1, {
                ease: Expo.easeOut,
                y: '0%',
                opacity: 1
            });
        }
    }

    // Effect 14
    class HoverImgFx14 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            let inner = '';
            const imgsArr = this.DOM.el.dataset.img.split(',');
            for (let i = 0, len = imgsArr.length; i <= len-1; ++i ) {
                inner += `<div class="hover-reveal__img" style="transform-origin:0% 0%;opacity:0;position:absolute;background-image:url(${imgsArr[i]})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.imgsTotal = this.DOM.revealImgs.length;

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
            this.DOM.reveal.style.opacity = 1;
            TweenMax.set(this.DOM.el, {zIndex: 1000});
            TweenMax.set(this.DOM.revealImgs, {opacity: 0});

            const show = () => {
                TweenMax.killTweensOf(this.DOM.revealImgs[this.current]);
                TweenMax.set(this.DOM.revealImgs[this.current], {zIndex: 1000});
                TweenMax.to(this.DOM.revealImgs[this.current], 0.4, {
                    ease: Quint.easeOut,
                    startAt: {opacity: 0, scale: 0.5, rotation: -15, x: '0%', y: '-10%'},
                    opacity: 1,
                    y: '0%',
                    rotation: 0,
                    scale: 1
                });
            };
            this.current = 0;
            show();
            
            const loop = () => {
                this.imgtimeout = setTimeout(() => {
                    this.DOM.revealImgs[this.current].style.zIndex = '';
                    TweenMax.to(this.DOM.revealImgs[this.current], 0.8, {
                        ease: Expo.easeOut,
                        x: `${getRandomFloat(-10,10)}%`,
                        y: `${getRandomFloat(10,60)}%`,
                        rotation: getRandomFloat(5,15),
                        opacity: 0
                    });
                    this.current= this.current < this.imgsTotal-1 ? this.current+1 : 0;
                    show();
                    loop();
                }, 500);
            }
            loop();
        }
        hideImage() {
            clearTimeout(this.imgtimeout);
            this.DOM.revealImgs[this.current].style.zIndex = '';
            this.DOM.revealImgs[this.current].style.opacity = 0;
            this.current = 0;
            TweenMax.set(this.DOM.el, {zIndex: ''});
            TweenMax.set(this.DOM.reveal, {opacity: 0})
        }
    }
        
    // Effect 15
    class HoverImgFx15 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 5;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
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
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0});

            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${(this.totalImages-1-i)*5}%`, 
                    y: `${(this.totalImages-1-i)*10}%`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages-1 ? 1.2 : 0.55, {
                    ease: i === this.totalImages-1 ? Quint.easeOut : Quad.easeOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '5%', y: '10%'} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null
                }), i*0.04);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach((letter) => {
                const opts = Math.round(Math.random()) === 0 ? {x: '100%', y: '100%', opacity: 0} : {opacity: 0};
                TweenMax.set(letter, opts);
            });
            TweenMax.to(this.DOM.letters, 1, {
                ease: Expo.easeOut,
                x: '0%',
                y: '0%',
                opacity: 1
            });
        }
    }

    // Effect 16
    class HoverImgFx16 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 10;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.rect = this.DOM.reveal.getBoundingClientRect();
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
                this.DOM.reveal.style.top = `${mousePos.y-this.rect.height-20-docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x-this.rect.width-20-docScrolls.left}px`;
            };
            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0, transformOrigin: '0% 0%'});
            
            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${(this.totalImages-1-i)*getRandomFloat(-10,-5)}%`, 
                    y: `${(this.totalImages-1-i)*getRandomFloat(-15,-10)}%`,
                    rotation: `${getRandomFloat(-5,5)}deg`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages-1 ? 0.3 : 0.3, {
                    ease: i === this.totalImages-1 ? Quint.easeOut : Sine.easeOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '-5%', y: '-10%'} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null,
                    rotation: 0
                }), i*0.02);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach((letter) => {
                const opts = Math.round(Math.random()) === 0 ? {x: '-100%', y: '-100%', opacity: 0} : {opacity: 0};
                TweenMax.set(letter, opts);
            });
            TweenMax.to(this.DOM.letters, 0.6, {
                ease: Expo.easeOut,
                x: '0%',
                y: '0%',
                opacity: 1
            });
        }
    }

    // Effect 17
    class HoverImgFx17 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 10;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
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
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0, transformOrigin: '0% 100%'});
            
            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${(this.totalImages-1-i)*15}%`, 
                    y: `${(this.totalImages-1-i)*-10}%`,
                    rotation: `${getRandomFloat(-7,7)}deg`,
                    scale: `${i === this.totalImages-1 ? 1 : getRandomFloat(0.2,1)}`,
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages-1 ? 0.8 : 0.55, {
                    ease: i === this.totalImages-1 ? Quint.easeOut : Quad.easeInOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '5%', y: '-10%'} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null,
                    //scale: 1
                }), i*0.06);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach((letter) => {
                const opts = Math.round(Math.random()) === 0 ? {x: '100%', y: '-100%', opacity: 0} : {opacity: 0};
                TweenMax.set(letter, opts);
            });
            TweenMax.to(this.DOM.letters, 1, {
                ease: Expo.easeOut,
                x: '0%',
                y: '0%',
                opacity: 1
            });
        }
    }

    // Effect 18
    class HoverImgFx18 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 10;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.rect = this.DOM.reveal.getBoundingClientRect();
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
                this.DOM.reveal.style.top = `${mousePos.y-this.rect.height-20-docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x-this.rect.width-20-docScrolls.left}px`;
            };
            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0});

            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${(this.totalImages-1-i)*-50}%`, 
                    y: `${(this.totalImages-1-i)*-getRandomFloat(-2,2)}%`,
                    rotation: `${i !== this.totalImages-1 ? getRandomFloat(-5,5) : 0}deg`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages-1 ? 0.4 : 0.55, {
                    ease: i === this.totalImages-1 ? Back.easeOut : Quad.easeInOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '-50%', y: '0%'} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null,
                }), i*0.02);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach((letter) => {
                const opts = Math.round(Math.random()) === 0 ? {x: '-100%', opacity: 0} : {opacity: 0};
                TweenMax.set(letter, opts);
            });
            TweenMax.to(this.DOM.letters, 1, {
                ease: Expo.easeOut,
                x: '0%',
                opacity: 1
            });
        }
    }

    // Effect 19
    class HoverImgFx19 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 35;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.rect = this.DOM.reveal.getBoundingClientRect();
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
                this.DOM.reveal.style.top = `${mousePos.y-this.rect.height-20-docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x-this.rect.width-20-docScrolls.left}px`;
            };
            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0, transformOrigin: '100% 100%'});

            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${(this.totalImages-1-i)*-8}%`, 
                    y: `${(this.totalImages-1-i)*-5}%`,
                    rotation: `${i !== this.totalImages-1 ? -1+3*(this.totalImages-i-1) : 0}deg`,
                    scale: `${mapNumber(i,0,this.totalImages-1,0.1,1)}`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages-1 ? 0.8 : 0.55, {
                    ease: i === this.totalImages-1 ? Back.easeOut : Quint.easeOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '-5%', y: '-5%', rotation: -10} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null,
                    rotation: i === this.totalImages-1 ? 0 : null
                }), i*0.01);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach((letter) => {
                const opts = Math.round(Math.random()) === 0 ? {x: '-200%', y: '-200%', opacity: 0} : {opacity: 0};
                TweenMax.set(letter, opts);
            });
            TweenMax.to(this.DOM.letters, 0.8, {
                ease: Expo.easeOut,
                x: '0%',
                y: '0%',
                opacity: 1
            });
        }
    }

    // Effect 20
    class HoverImgFx20 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 10;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += i === this.totalImages-1 ? `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>` :
                                                    `<div class="hover-reveal__img" style="filter: hue-rotate(60deg) saturate(5); position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            charming(this.DOM.el);
            this.DOM.letters = [...this.DOM.el.querySelectorAll('span')];
            this.letterColor = getComputedStyle(this.DOM.el).color;
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set([this.DOM.revealImgs], {opacity: 0});
            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: i === this.totalImages-1 ? '0%' : `${getRandomFloat(-5,5)}%`, 
                    y: i === this.totalImages-1 ? '0%' : `${getRandomFloat(-5,5)}%`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], 0.25, {
                    ease: Quad.easeOut,
                    startAt: {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0
                }), i*0.04);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            const setColor = letter => TweenMax.set(letter, {
                color: ['#fff', '#0ff', '#f0f'][parseInt(getRandomFloat(0,3))],
                opacity: Math.round(Math.random()) === 0 ? 1 : 0
            });
            this.DOM.letters.forEach((letter) => {
                TweenMax.to(letter, 0.1, {
                    ease: Expo.easeOut,
                    onStart: () => setColor(letter),
                    onRepeat: () => setColor(letter),
                    startAt: {x: `${getRandomFloat(-50,50)}%`, y: `${getRandomFloat(-50,50)}%`},
                    x: '0%',
                    y: '0%',
                    repeat: 3,
                    onComplete: () => TweenMax.set(letter, {color: this.letterColor, opacity: 1}),
                });
            });
        }
    }

    // Effect 21
    class HoverImgFx21 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 15;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += i === this.totalImages-1 ? `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>` :
                                                    `<div class="hover-reveal__img" style="filter: hue-rotate(90deg) saturate(9); position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.rect = this.DOM.reveal.getBoundingClientRect();
            charming(this.DOM.el);
            this.DOM.letters = [...this.DOM.el.querySelectorAll('span')];
            this.letterColor = getComputedStyle(this.DOM.el).color;
            this.initEvents();
        }
        initEvents() {
            this.positionElement = (ev) => {
                const mousePos = getMousePos(ev);
                const docScrolls = {
                    left : document.body.scrollLeft + document.documentElement.scrollLeft, 
                    top : document.body.scrollTop + document.documentElement.scrollTop
                };
                this.DOM.reveal.style.top = `${mousePos.y-this.rect.height-20-docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x+20-docScrolls.left}px`;
            };
            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0});

            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${i !== this.totalImages-1 ? getRandomFloat(-45,45) : 0}%`, 
                    y: `${i !== this.totalImages-1 ? getRandomFloat(-45,45) : 0}%`,
                    rotation: `${i !== this.totalImages-1 ? getRandomFloat(-10,10) : 0}`,
                    scale: `${i !== this.totalImages-1 ? getRandomFloat(0.1,1.2) : 0.9}`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], 0.5, {
                    ease: Quint.easeOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '0%', y: '0%'} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null,
                    scale: i === this.totalImages-1 ? 1 : null
                }), i*0.02);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            const setColor = letter => TweenMax.set(letter, {
                color: ['#fff', '#0ff', '#f0f'][parseInt(getRandomFloat(0,3))],
                opacity: Math.round(Math.random()) === 0 ? 1 : 0
            });
            this.DOM.letters.forEach((letter) => {
                TweenMax.to(letter, 0.1, {
                    ease: Expo.easeOut,
                    onStart: () => setColor(letter),
                    onRepeat: () => setColor(letter),
                    startAt: {x: `${getRandomFloat(-50,50)}%`, y: `${getRandomFloat(-50,50)}%`},
                    x: '0%',
                    y: '0%',
                    repeat: 3,
                    onComplete: () => TweenMax.set(letter, {color: this.letterColor, opacity: 1}),
                });
            });
        }
    }
	
    // Effect 22
    class HoverImgFx22 {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.DOM.reveal.innerHTML = `<div class="hover-reveal__img" style="background-image:url(${this.DOM.el.dataset.img})"></div>`;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImg = this.DOM.reveal.querySelector('.hover-reveal__img');

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
            TweenMax.killTweensOf(this.DOM.revealImg);

            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .add('begin')
            .set(this.DOM.revealImg, {transformOrigin: '95% 50%', x: '100%'})
            .add(new TweenMax(this.DOM.revealImg, 0.2, {
                ease: Sine.easeOut,
                startAt: {scaleX: 0.5, scaleY: 1},
                scaleX: 1.5,
                scaleY: 0.7
            }), 'begin')
            .add(new TweenMax(this.DOM.revealImg, 0.8, {
                ease: Expo.easeOut,
                startAt: {rotation: 10, y: '5%', opacity: 0},
                rotation: 0,
                y: '0%',
                opacity: 1
            }), 'begin')
            .set(this.DOM.revealImg, {transformOrigin: '0% 50%'})
            .add(new TweenMax(this.DOM.revealImg, 0.6, {
                ease: Expo.easeOut,
                scaleX: 1,
                scaleY: 1,
                opacity: 1
            }), 'begin+=0.2')
            .add(new TweenMax(this.DOM.revealImg, 0.6, {
                ease: Expo.easeOut,
                x: '0%'
            }), 'begin+=0.2')
        }
        hideImage() {
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
            .add(new TweenMax(this.DOM.revealImg, 0.2, {
                ease: Sine.easeOut,
                opacity: 0,
                x: '-20%'
            }), 'begin');
        }
    }    

    // Effect 23
    class HoverImgFx23 {
        constructor(el) {
            this.DOM = {el: el};
            
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            this.totalImages = 15;
            let inner = '';
            for (let i = 0; i <= this.totalImages-1; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${this.DOM.el.dataset.img})"></div>`;
            }
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.rect = this.DOM.reveal.getBoundingClientRect();
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
                this.DOM.reveal.style.top = `${mousePos.y-this.rect.height-20-docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x-this.rect.width-20-docScrolls.left}px`;
            };
            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.animateLetters();
                this.showImage();
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
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    this.DOM.reveal.style.opacity = 1;
                    TweenMax.set(this.DOM.el, {zIndex: 1000});
                }
            })
            .set(this.DOM.revealImgs, {opacity: 0});

            for (let i = 0; i <= this.totalImages-1; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${i*getRandomFloat(-10,10)}%`, 
                    y: `${i*getRandomFloat(-15,15)}%`,
                    rotation: `${i !== this.totalImages-1 ? getRandomFloat(-7,7) : 0}deg`,
                    scale: `${getRandomFloat(0.1,0.5)}`
                });
                
                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages-1 ? 0.8 : 0.5, {
                    ease: i === this.totalImages-1 ? Expo.easeOut : Quint.easeOut,
                    startAt: i === this.totalImages-1 ? {opacity: 1, x: '0%', y: '-10%'} : {opacity: 1},
                    opacity: i === this.totalImages-1 ? 1 : 0,
                    x: i === this.totalImages-1 ? '0%' : null,
                    y: i === this.totalImages-1 ? '0%' : null,
                    scale: i === this.totalImages-1 ? 1 : 0.6
                }), i*0.04);
            }
        }
        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, {zIndex: 999});
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, {zIndex: ''});
                    TweenMax.set(this.DOM.reveal, {opacity: 0});
                }
            })
            .add(new TweenMax(this.DOM.revealImgs[this.totalImages-1], 0.15, {
                ease: Sine.easeOut,
                opacity: 0
            }))
        }
        animateLetters() {
            TweenMax.killTweensOf(this.DOM.letters);
            this.DOM.letters.forEach((letter) => {
                const opts = Math.round(Math.random()) === 0 ? {scale: 0, opacity: 0} : {opacity: 0};
                TweenMax.set(letter, opts);
            });
            TweenMax.to(this.DOM.letters, 1, {
                ease: Expo.easeOut,
                scale: 1,
                opacity: 1
            });
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
    imagesLoaded(document.querySelectorAll('.preload'), () => document.body.classList.remove('loading'));
}

