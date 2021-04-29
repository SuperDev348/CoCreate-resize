// "use strict";
import observer from "@cocreate/observer";
import "./style.css";


const coCreateResize = {
    selector: '', //'.resize',
    resizers: [],
    resizeWidgets: [],

    init: function(handleObj) {
        for (var handleKey in handleObj)
            if (handleObj.hasOwnProperty(handleKey) && handleKey == 'selector')
                this.selector = handleObj[handleKey];

        this.resizers = document.querySelectorAll(this.selector);
        var _this = this;
        this.resizers.forEach(function(resize, idx) {
            let resizeWidget = new CoCreateResize(resize, handleObj);
            _this.resizeWidgets[idx] = resizeWidget;
        })
    },

    initElement: function(target) {
        let resizeWidget = new CoCreateResize(target, {
            dragLeft: "[data-resize_handle='left']",
            dragRight: "[data-resize_handle='right']",
            dragTop: "[data-resize_handle='top']",
            dragBottom: "[data-resize_handle='bottom']"
        });
        this.resizeWidgets[0] = resizeWidget;
    }
}

function CoCreateResize(resizer, options) {
    this.resizeWidget = resizer;
    this.cornerSize = 10;
    this.init(options);
}

let drags = ['left', 'right', 'top', 'bottom'];

CoCreateResize.prototype = {
    init: function(handleObj) {
        if (this.resizeWidget) {
            this.drag = {};
            this.drag['left'] = this.resizeWidget.querySelector(handleObj['dragLeft']);
            this.drag['right'] = this.resizeWidget.querySelector(handleObj['dragRight']);
            this.drag['top'] = this.resizeWidget.querySelector(handleObj['dragTop']);
            this.drag['bottom'] = this.resizeWidget.querySelector(handleObj['dragBottom']);
            this.bindListeners();
            this.initResize();
        }
    },

    initResize: function() {
        drags.forEach((item) => {
            if (this.drag[item]) {
                let params = {};
                if (item === 'left' || item === 'right')
                    params = { first:{dir: item, corner: 'top', sign: 1}, second:{dir: item, corner: 'bottom', sign: -1}}
                if (item === 'top' || item === 'bottom')
                    params = { first:{dir: item, corner: 'left', sign: 1}, second:{dir: item, corner: 'right', sign: -1}}
                this.addListenerMulti(this.drag[item], 'mousemove touchmove', this.checkDrag);
            }
        })
    },

    checkDrag: function(e) {
        const drag = e.target.getAttribute('data-resize');
        let params = {};
        if (drag === 'left' || drag === 'right')
            params = { first:{dir: drag, corner: 'top', scroll: document.documentElement.scrollTop, client: e.clientY, sign: 1, cursor: 'e-resize'}, 
                        second:{dir: drag, corner: 'bottom', scroll: document.documentElement.scrollTop, client: e.clientY, sign: -1, cursor: 'e-resize'}}
        if (drag === 'top' || drag === 'bottom')
            params = { first:{dir: drag, corner: 'left', scroll: document.documentElement.scrollLeft, client: e.clientX, sign: 1, cursor: 's-resize'}, 
                        second:{dir: drag, corner: 'right', scroll: document.documentElement.scrollLeft, client: e.clientX, sign: -1, cursor: 's-resize'}}
        this.checkDragCorner(e, params.first);
        this.checkDragCorner(e, params.second);
    },

    checkDragCorner: function(e, params) {
        let offset;
        this.removeListenerMulti(this.drag[params.dir], 'mousedown touchstart', this.initDrag[params.dir]);
        this.removeListenerMulti(this.drag[params.dir], 'mousedown touchstart', this.initDrag[params.corner]);
        this.addListenerMulti(this.drag[params.dir], 'mousedown touchstart', this.initDrag[params.dir]);
        if (this.drag[params.corner]) {
            if (e.touches)
                e = e.touches[0];
            if (params.dir === 'left' || params.dir === 'right')
                offset = params.client - this.getTopDistance(this.drag[params.corner]) + params.scroll;
            if (params.dir === 'top' || params.dir === 'bottom')
                offset = params.client - this.getLeftDistance(this.drag[params.corner]) + params.scroll;
            offset = offset * params.sign;
            if (offset < this.cornerSize) {
                this.drag[params.dir].style.cursor = this.getCornerCursor(params.dir, params.corner);
                this.addListenerMulti(this.drag[params.dir], 'mousedown touchstart', this.initDrag[params.corner]);
            } else {
                this.drag[params.dir].style.cursor = params.cursor;
            }
        }
    },

    convertDirToSign: function(dir) {
        if (dir === 'left' || dir === 'top')
            return 1;
        if (dir === 'right' || dir === 'bottom')
            return -1;
    },

    getCornerCursor: function(dir, corner) {
        if (this.convertDirToSign(dir) * this.convertDirToSign(corner) === 1)
            return 'se-resize';
        else
            return 'ne-resize';
    },

    dragFuc: function(e, dir) {
        this.processIframe();
        this.startLeft = parseInt(document.defaultView.getComputedStyle(this.resizeWidget).left, 10);
        this.startWidth = parseInt(document.defaultView.getComputedStyle(this.resizeWidget).width, 10);
        this.startTop = parseInt(document.defaultView.getComputedStyle(this.resizeWidget).top, 10);
        this.startHeight = parseInt(document.defaultView.getComputedStyle(this.resizeWidget).height, 10);

        if (e.touches) {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
        }
        else {
            this.startX = e.clientX;
            this.startY = e.clientY;
        }
        if (dir === 'right')
            this.addListenerMulti(document.documentElement, 'mousemove touchmove', this.doRightDrag);
        else if (dir === 'left')
            this.addListenerMulti(document.documentElement, 'mousemove touchmove', this.doLeftDrag);
        else if (dir === 'top')
            this.addListenerMulti(document.documentElement, 'mousemove touchmove', this.doTopDrag);
        else if (dir === 'bottom')
            this.addListenerMulti(document.documentElement, 'mousemove touchmove', this.doBottomDrag);
        this.addListenerMulti(document.documentElement, 'mouseup touchend', this.stopDrag);
    },

    initDrag: {
        right: function(e) {
            this.dragFuc(e, 'right');
        },
        left: function(e) {
            this.dragFuc(e, 'left');
        },
        top: function(e) {
            this.dragFuc(e, 'top');
        },
        bottom: function(e) {
            this.dragFuc(e, 'bottom');
        },
    },

    doTopDrag: function(e) {
        let top, height;

        if (e.touches)
            e = e.touches[0];
        top = this.startTop + e.clientY - this.startY;
        height = this.startHeight - e.clientY + this.startY;

        if (top < 10 || height < 10)
            return;
        this.resizeWidget.style.top = top + 'px';
        this.resizeWidget.style.height = height + 'px';
    },

    doBottomDrag: function(e) {
        let height = 0;

        if (e.touches)
            height = this.startHeight + e.touches[0].clientY - this.startY;
        else
            height = this.startHeight + e.clientY - this.startY;

        if (height < 10)
            return;
        this.resizeWidget.style.height = height + 'px';
    },

    doLeftDrag: function(e) {
        let left, width;
        if (e.touches)
            e = e.touches[0];
        left = this.startLeft + e.clientX - this.startX;
        width = this.startWidth - e.clientX + this.startX;

        if (width < 10)
            return;
        this.resizeWidget.style.left = left + 'px';
        this.resizeWidget.style.width = width + 'px';
    },

    doRightDrag: function(e) {
        let width = 0;
        if (e.touches)
            width = this.startWidth + e.touches[0].clientX - this.startX;
        else
            width = this.startWidth + e.clientX - this.startX;
        if (width < 10)
            return;
        this.resizeWidget.style.width = width + 'px';
    },

    stopDrag: function(e) {
        this.resizeWidget.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = null;
        });

        this.removeListenerMulti(document.documentElement, 'mousemove touchmove', this.doTopDrag);
        this.removeListenerMulti(document.documentElement, 'mousemove touchmove', this.doBottomDrag);
        this.removeListenerMulti(document.documentElement, 'mousemove touchmove', this.doLeftDrag);
        this.removeListenerMulti(document.documentElement, 'mousemove touchmove', this.doRightDrag);
        this.removeListenerMulti(document.documentElement, 'mouseup touchend', this.stopDrag);
    },

    bindListeners: function() {
        this.dragFuc = this.dragFuc.bind(this);
        this.initDrag.left = this.initDrag.left.bind(this);
        this.initDrag.right = this.initDrag.right.bind(this);
        this.initDrag.top = this.initDrag.top.bind(this);
        this.initDrag.bottom = this.initDrag.bottom.bind(this);
        this.doLeftDrag = this.doLeftDrag.bind(this);
        this.doTopDrag = this.doTopDrag.bind(this);
        this.doRightDrag = this.doRightDrag.bind(this);
        this.doBottomDrag = this.doBottomDrag.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.checkDrag = this.checkDrag.bind(this);
        this.checkDragCorner = this.checkDragCorner.bind(this);
        this.getCornerCursor = this.getCornerCursor.bind(this);
    },

    // Get an element's distance from the top of the page
    getTopDistance: function(elem) {
        var location = 0;
        if (elem.offsetParent) {
            do {
                location += elem.offsetTop;
                elem = elem.offsetParent;
            } while (elem);
        }
        return location >= 0 ? location : 0;
    },

    // Get an element's distance from the left of the page
    getLeftDistance: function(elem) {
        var location = 0;
        if (elem.offsetParent) {
            do {
                location += elem.offsetLeft;
                elem = elem.offsetParent;
            } while (elem);
        }
        return location >= 0 ? location : 0;
    },

    // Bind multiiple events to a listener
    addListenerMulti: function(element, eventNames, listener) {
        var events = eventNames.split(' ');
        for (var i = 0, iLen = events.length; i < iLen; i++) {
            element.addEventListener(events[i], listener, false);
        }
    },

    // Remove multiiple events from a listener
    removeListenerMulti: function(element, eventNames, listener) {
        var events = eventNames.split(' ');
        for (var i = 0, iLen = events.length; i < iLen; i++) {
            element.removeEventListener(events[i], listener, false);
        }
    },

    // style="pointer-events:none" for iframe when drag event starts
    processIframe: function() {
        this.resizeWidget.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = 'none';
        });
    }
}

observer.init({
    name: 'CoCreateResize',
    observe: ['subtree', 'childList'],
    include: '.resize',
    callback: function(mutation) {
        coCreateResize.initElement(mutation.target);
    }
})

export default coCreateResize;