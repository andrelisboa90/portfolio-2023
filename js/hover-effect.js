// Hover Image Effect - Simplified (Image reveal only, no letter animation)
(function() {
    const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
        if (!e) e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        return { x: posx, y: posy };
    };

    const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

    class HoverImageEffect {
        constructor(el) {
            this.DOM = { el: el };
            this.totalImages = 10;
            
            // Create the reveal container
            this.DOM.reveal = document.createElement('div');
            this.DOM.reveal.className = 'hover-reveal';
            
            // Get image URL from data-hover-img attribute
            const imageUrl = this.DOM.el.dataset.hoverImg;
            if (!imageUrl) {
                console.warn('No data-hover-img attribute found on element:', el);
                return;
            }
            
            // Create image layers
            let inner = '';
            for (let i = 0; i < this.totalImages; ++i) {
                inner += `<div class="hover-reveal__img" style="position: absolute; background-image:url(${imageUrl})"></div>`;
            }
            
            this.DOM.reveal.innerHTML = inner;
            this.DOM.el.appendChild(this.DOM.reveal);
            this.DOM.revealImgs = [...this.DOM.reveal.querySelectorAll('.hover-reveal__img')];
            this.rect = this.DOM.reveal.getBoundingClientRect();

            this.initEvents();
        }

        initEvents() {
            this.positionElement = (ev) => {
                const mousePos = getMousePos(ev);
                const docScrolls = {
                    left: document.body.scrollLeft + document.documentElement.scrollLeft,
                    top: document.body.scrollTop + document.documentElement.scrollTop
                };
                this.DOM.reveal.style.top = `${mousePos.y - this.rect.height - 20 - docScrolls.top}px`;
                this.DOM.reveal.style.left = `${mousePos.x - this.rect.width - 20 - docScrolls.left}px`;
            };

            this.mouseenterFn = (ev) => {
                this.positionElement(ev);
                this.showImage();
            };

            this.mousemoveFn = (ev) => {
                requestAnimationFrame(() => {
                    this.positionElement(ev);
                });
            };

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
                    TweenMax.set(this.DOM.el, { zIndex: 1000 });
                }
            })
                .set(this.DOM.revealImgs, { opacity: 0 });

            for (let i = 0; i < this.totalImages; ++i) {
                TweenMax.set(this.DOM.revealImgs[i], {
                    x: `${(this.totalImages - 1 - i) * -50}%`,
                    y: `${(this.totalImages - 1 - i) * -getRandomFloat(-2, 2)}%`,
                    rotation: `${i !== this.totalImages - 1 ? getRandomFloat(-5, 5) : 0}deg`
                });

                this.tl.add(new TweenMax(this.DOM.revealImgs[i], i === this.totalImages - 1 ? 0.4 : 0.55, {
                    ease: i === this.totalImages - 1 ? Back.easeOut : Quad.easeInOut,
                    startAt: i === this.totalImages - 1 ? { opacity: 1, x: '-50%', y: '0%' } : { opacity: 1 },
                    opacity: i === this.totalImages - 1 ? 1 : 0,
                    x: i === this.totalImages - 1 ? '0%' : null,
                    y: i === this.totalImages - 1 ? '0%' : null,
                }), i * 0.02);
            }
        }

        hideImage() {
            TweenMax.killTweensOf(this.DOM.revealImgs);
            this.tl = new TimelineMax({
                onStart: () => {
                    TweenMax.set(this.DOM.el, { zIndex: 999 });
                },
                onComplete: () => {
                    TweenMax.set(this.DOM.el, { zIndex: '' });
                    TweenMax.set(this.DOM.reveal, { opacity: 0 });
                }
            })
                .add(new TweenMax(this.DOM.revealImgs[this.totalImages - 1], 0.15, {
                    ease: Sine.easeOut,
                    opacity: 0
                }))
        }
    }

    // Initialize hover effects on all elements with data-hover-img attribute
    [...document.querySelectorAll('a[data-hover-img]')].forEach(link => new HoverImageEffect(link));
})();
