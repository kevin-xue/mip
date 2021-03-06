define(function (require) {
    'use strict';

    var util = require('./util');
    var EventEmitter = require('./utils/event-emitter');
    var fixedElement = require('./fixed-element');
    var rect = util.rect;
    
    // Native objects.
    var docElem = document.documentElement;
    var win = window;
    
    /**
     * The object is to solve a series of problems when the page in an iframe and
     * provide some additional methods.
     */
    var viewport = {
        /**
         * Get the current vertical position of the page
         * @return {number}
         */
        getScrollTop: function () {
            return rect.getScrollTop();
        },

        /**
         * Get the current horizontal position of the page
         * @return {number}
         */
        getScrollLeft: function () {
            return rect.getScrollLeft();
        },

        /**
         * Set the current vertical position of the page
         * @param {number} top The target scrollTop
         */
        setScrollTop: function (top) {
            rect.setScrollTop(top);
        },

        /**
         * Get the width of the viewport
         * @return {number}
         */
        getWidth: function () {
            return win.innerWidth || docElem.clientWidth;
        },

        /**
         * Get the height of the viewport
         * @return {number}
         */
        getHeight: function () {
            return win.innerHeight || docElem.clientHeight;
        },

        /**
         * Get the scroll width of the page
         * @return {number}
         */
        getScrollWidth: function () {
            return rect.getScrollWidth();
        },

        /**
         * Get the scroll height of the page
         * @return {number}
         */
        getScrollHeight: function () {
            return rect.getScrollHeight();
        },

        /**
         * Get the rect of the viewport.
         * @return {Object}
         */
        getRect: function () {
            return rect.get(
                this.getScrollLeft(),
                this.getScrollTop(),
                this.getWidth(),
                this.getHeight());
        }
    };

    /**
     * The bound handler for changed event.
     * @inner
     * @type {Function}
     */
    var boundChangeEvent;

    /**
     * Initialize the viewport
     * @return {Viewport}
     */
    function init() {
        fixedElement.init();
        boundChangeEvent = changedEvent.bind(this);
        (util.platform.needSpecialScroll ? document.body : win)
            .addEventListener('scroll', scrollEvent.bind(this), false);
        win.addEventListener('resize', resizeEvent.bind(this), false);
        return this;
    }
    
    /**
     * Whether the changed event is firing.
     * @inner
     * @type {boolean}
     */
    var isChanging = false;

    /**
     * The last event object of changed event.
     * @inner
     * @type {Event}
     */
    var lastEvent = null;

    /**
     * The last time of changed event.
     * @inner
     * @type {number}
     */
    var lastTime;

    /**
     * The last scrollTop of changed event.
     * @inner
     * @type {number}
     */
    var lastScrollTop;

    /**
     * The scroll handler
     * @param {Event} event
     */
    function scrollEvent(event) {
        var scrollTop = this.getScrollTop();

        var now = Date.now();
        // If the delta time >= 20ms, immediately calculate whether to trigger changed.
        // PS: UC browser does not dispatch the scroll event, when the finger is pressed.
        if (!isChanging || now - lastTime >= 20) {
            isChanging = true;
            boundChangeEvent();
            lastTime = now;
            lastScrollTop = scrollTop;
            lastEvent = event;
        }
        this.trigger('scroll', event);
    }
    
    /**
     * The resize event handler.
     * @param {Event} event
     */
    function resizeEvent(event) {
        this.trigger('resize', event);
    }

    /**
     * Timer for changed event.
     * @inner
     * @type {number}
     */
    var changedTimer = null;

    /**
     * To determine whether to trigger a changed event.
     */
    function changedEvent() {
        var now = Date.now();
        var delay = now - lastTime || 0;
        clearTimeout(changedTimer);
        if (delay && Math.abs((lastScrollTop - this.getScrollTop()) / delay) < 0.03) {
            isChanging = false;
            this.trigger('changed', lastEvent, this.getRect());
        } else {
            changedTimer = setTimeout(boundChangeEvent, delay >= 20 ? 20 : 20 - delay);
        }
    }

    // Mix the methods and attributes of Event into the viewport.
    EventEmitter.mixin(viewport);

    return init.call(viewport);
});
