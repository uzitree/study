export default class LazyLoad {
  constructor(el, options) {
    this.el = el
    this.elements = document.querySelectorAll(this.el)
    const settings = {
        threshold       : 0,
        //failure_limit   : 0,
        event           : "scroll",
        //effect          : "show",
        container       : window,
        data_attribute  : "original",
        skip_invisible  : false,
        appear          : null,
        load            : null,
        placeholder     : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
    }
    this.settings = Object.assign(settings, options)
    this.loadStart.apply(this)
  }
  
  loadStart() {
    /* Cache container as jQuery as object. */
    const s = this.settings
    const container = (s.container === undefined || s.container === window) ? window : s.container

    /* Fire one scroll event per scroll. Not one scroll event per image. */
    if (s.event.includes("scroll")) {
      container.addEventListener(s.event, () => {
        this.update()
      })
    }
    if (s.event.includes("touchmove")) {
      container.addEventListener(s.event, () => {
        this.update()
      })
    }
    var nav = navigator
    var isTouchPad = (/hp-tablet/gi).test(navigator.appVersion)
    var hasTouch = 'ontouchstart' in window && !isTouchPad
    var vendor = (/webkit/i).test(nav.appVersion) ? "webkit": (/firefox/i).test(nav.userAgent) ? "Moz": "opera" in window ? "O": (/MSIE/i).test(nav.userAgent) ? "ms": ""
    var TRANSITIONEND_EV = "webkitTransitionEnd"
    if (vendor === "Moz") {
        TRANSITIONEND_EV = "transitionend"
    } else {
        if (vendor === "O") {
            TRANSITIONEND_EV = "oTransitionEnd"
        } else {
            if (vendor === "ms") {
                TRANSITIONEND_EV = "MSTransitionEnd"
            }
        }
    }

    console.log(TRANSITIONEND_EV)
    if (s.event.includes("transitionend")) {
      container.addEventListener(TRANSITIONEND_EV, () => {
        this.update()
      })
    }
    
    Object.values(this.elements).forEach((img) => {
      //console.log(img.getAttribute('pindex') + ' - appear')
      img.loaded = false
      /* If no src attribute given use data:uri. */
      if (img.tagName === 'IMG') {
        if (img.getAttribute('src') === null || img.getAttribute('src') === undefined) {
          img.setAttribute('src', s.placeholder)
        }
      } else if (img.style.backgroundImage.length < 6) {
        img.style.backgroundImage = 'url(' + s.placeholder + ')'
      }
      /* When appear is triggered load original image. */
      img.addEventListener('appear', () => { //one ???
        const self = img
        if (!self.loaded && self.getAttribute("data-" + s.data_attribute + '-loaded') != '1') {
          if (s.appear) {
              // 回调 ???
              //const elements_left = this.$el.length;
              //settings.appear.call(self, elements_left, settings);
          }
          const original = self.getAttribute("data-" + s.data_attribute);
          const tempImg = document.createElement('img')
          tempImg.addEventListener('load', () => {
            self.style.display = 'none'
            if (self.tagName === 'IMG') {
              self.src = original
            } else if (self.style.backgroundImage.length < 6) {
              self.style.backgroundImage = 'url(' + original + ')'
            }
            //$self[settings.effect](settings.effect_speed);
            //$self.css("display", "");//clean display
            self.style.display = '' //clean display
            self.loaded = true;
            self.setAttribute("data-" + s.data_attribute + '-loaded', '1'); //clean display
            /* Remove image from array so it is not looped next time. */
            /*var temp = $.grep(elements, function(element) {
                return !element.loaded;
            });
            elements = $(temp);

            if (settings.load) {
                var elements_left = elements.length;
                settings.load.call(self, elements_left, settings);
            }*/
          })
          tempImg.src = original
        }
      }, false)
    })

    //this.update()
    //console.log('init this.update', this)
    
    /* Check if something appears when window is resized. */
    window.onresize = () => {
      this.update();
      console.log('onresize this.update', this)
    }

    /* With IOS5 force loading images when navigating with back button. */
      /* Non optimal workaround. */
      if ((/(?:iphone|ipod|ipad).*os 5/gi).test(navigator.appVersion)) {
        window.addEventListener("pageshow", function(event) {
          if (event.originalEvent && event.originalEvent.persisted) {
            Object.values(this.elements).forEach((img) => {
              trigger(img, "appear");
            })
          }
        });
    }

    /* Force initial check if images should appear. */
    window.onload = () => {
      console.log('onload this.update', this)
      this.update()
    }
  }

  update() {
    let counter = 0;
    const s = this.settings
    Object.values(this.elements).forEach((img) => {
      if (s.skip_invisible && img.style.display === 'none') {
          return
      }
      if (0 === s.event.indexOf("touchmove") || 0 === s.event.indexOf("transitionend")) {
        if (abovethetop_touch(img, s) || leftofbegin(img, s)) {
            // Nothing. 
        } else if (!belowthefold_touch(img, s) && !rightoffold(img, s)) {
          trigger(img, 'appear')
          // if we found an image we'll load, reset the counter 
          counter = 0
        } else {
          /*if (++counter > s.failure_limit) {
              return false;
          }*/
        }
      } else {
        let att = abovethetop(img, s)
        let lob = leftofbegin(img, s)
        let btf = belowthefold(img, s)
        let rof = rightoffold(img, s)
        if (att || lob) { //(abovethetop(img, s) || leftofbegin(img, s))
          // Nothing. 
        } else if (!btf && !rof) { // (!belowthefold(img, s) && !rightoffold(img, s))
          trigger(img, 'appear')
          // if we found an image we'll load, reset the counter
          counter = 0
        } else {
          /*if (++counter > s.failure_limit) {
              return false;
          }*/
        }
      }
    })
  }
}


const window_H = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
const window_W = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
let getOffest = (elem) => {
  let docElem, box = { top: 0, left: 0 }, doc = elem && elem.ownerDocument
	if ( !doc ) {
		return
	}
	docElem = doc.documentElement
	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== "undefined" ) {
		box = elem.getBoundingClientRect()
	}
	return {
		top: box.top  + ( window.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
		left: box.left + ( window.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
	}
}
let belowthefold = (element, settings) => {
  let fold
  if (settings.container === undefined || settings.container === window) {
      fold = window_H + window.pageYOffset
  } else {
      fold = getOffest(settings.container).top + (settings.container.height || settings.container.clientHeight)
  }
  return fold <= getOffest(element).top - settings.threshold
}
let belowthefold_touch = (element, settings) => {
  const fold = window_H
  return fold <= getOffest(element).top - settings.threshold
}
let rightoffold = (element, settings) => {
  let fold
  if (settings.container === undefined || settings.container === window) {
      fold = window_W + window.pageXOffset
  } else {
      fold = getOffest(settings.container).left + (settings.container.width || settings.container.clientWidth)
  }
  return fold <= getOffest(element).left - settings.threshold
}
let abovethetop = (element, settings) => {
  let fold;
  if (settings.container === undefined || settings.container === window) {
      fold = window.pageYOffset
  } else {
      fold = getOffest(settings.container).top
  }
  return fold >= getOffest(element).top + settings.threshold  + (element.height || element.clientHeight)
}
let abovethetop_touch = (element, settings) => {
  const fold = 0;
  return fold >= getOffest(element).top + settings.threshold  + (element.height || element.clientHeight)
}
let leftofbegin = (element, settings) => {
  let fold
  if (settings.container === undefined || settings.container === window) {
      fold = window.pageXOffset
  } else {
      fold = getOffest(settings.container).left;
  }

  return fold >= getOffest(element).left + settings.threshold + (element.width || element.clientWidth)
}
let inviewport = (element, settings) => {
  return !rightoffold(element, settings) && !leftofbegin(element, settings) &&
      !belowthefold(element, settings) && !abovethetop(element, settings)
}
let trigger = (target, eventName) => {
  const event = document.createEvent('Event')
  event.initEvent(eventName, false, false)
  target.dispatchEvent(event)
}