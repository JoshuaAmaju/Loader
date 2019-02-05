class Loader {
    constructor(options) {
        this.loader;
        this.bar;
        this.options = options || {};

        this.targetWidth = this.options.parent !== undefined ?
        this.options.parent.getBoundingClientRect().width
        : window.innerWidth;

        this.style = `
        .loader {
            opacity: 0;
            width: 100%;
            height: 4px;
            z-index: 1000;
            background: #ccc;
            transition: 0.1s;
            visibility: hidden;
            top: ${this.options.y || 0}px;
            left: ${this.options.x || 0}px;
            position: ${this.options.parent === undefined ? 'fixed' : 'absolute'};
        }

        .loader.load {
            opacity: 1;
            visibility: visible;
        }
        
        .bar {
            width: 0;
            height: 100%;
            background: ${this.options.color || `#000`};
            position: relative;
            transition: inherit;
        }
        `;
        
        this.styleEl;
        this.tick;
        this.rate = 10;

        this.loadAnimFrame();
        this.createStyle();
        this.createLoader();
    }

    createStyle() {
        this.styleEl = document.createElement('style');
        this.styleEl.type = 'text/css';
        this.styleEl.appendChild(document.createTextNode(this.style));
        document.head.appendChild(this.styleEl);
    }

    createLoader() {
        this.loader = document.createElement('div');
        this.bar = document.createElement('div');

        this.loader.className = 'loader';
        this.bar.className = 'bar';
        
        this.loader.appendChild(this.bar);

        if (this.options.parent === undefined) {
            document.body.appendChild(this.loader);
        } else {
            this.options.parent.style.position = 'relative';
            this.options.parent.appendChild(this.loader);
        }
    }

    loadAnimFrame() {
        // requestAnimationFrame() shim by Paul Irish
        // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        
        window.requestAnimFrame = (function () {
            return window.requestAnimationFrame || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame || 
            window.oRequestAnimationFrame || 
            window.msRequestAnimationFrame || 
            
            function (callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
        })();

        /**
        * Behaves the same as setInterval except uses requestAnimationFrame() where possible for better performance
        * @param {function} fn The callback function
        * @param {int} delay The delay in milliseconds
        **/
       
        window.requestInterval = function(fn, delay) {
            if (!window.requestAnimationFrame && 
            !window.webkitRequestAnimationFrame && 
            !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
            !window.oRequestAnimationFrame && 
            !window.msRequestAnimationFrame) {
                return window.setInterval(fn, delay);
            }
            
            var start = Date.now(),
            handle = new Object();
            
            function loop() {
                var current = Date.now(),
                delta = current - start;
                
                if(delta >= delay) {
                    fn.call();
                    start = Date.now();
                }
                
                handle.value = requestAnimFrame(loop);
            }
            
            handle.value = requestAnimFrame(loop);
            return handle;
        }
        
        /**
        * Behaves the same as clearInterval except uses cancelRequestAnimationFrame() where possible for better performance
        * @param {int|object} fn The callback function
        **/
       
        window.clearRequestInterval = function (handle) {
            window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
            window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
            window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
            window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
            window.oCancelRequestAnimationFrame	? window.oCancelRequestAnimationFrame(handle.value) :
            window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
            clearInterval(handle);
        };
    }
}

Loader.prototype.start = function() {
    const self = this;
    let width = 0;
    const startTime = new Date();
    this.loader.classList.add('load');

    this.tick = window.requestInterval(() => {
        let timeInSeconds = (new Date().getTime() - startTime) / 1000;

        // width = window.innerWidth / delay;
        self.bar.style.width = `${width < 0 ? 10 : width}px`;
        width = self.targetWidth - (self.targetWidth / timeInSeconds);
    }, this.rate);
} ;

Loader.prototype.finish = function() {
    const self = this;
    window.clearRequestInterval(this.tick);
    this.bar.style.width = '100%';
    setTimeout(() => {
        self.bar.style.cssText = '';
        self.loader.classList.remove('load');
    }, 100);
};