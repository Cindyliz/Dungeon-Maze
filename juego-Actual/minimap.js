/**
 * jquery.minimap-0.1.js - Container Minimap Plugin
 * ==========================================================
 * (C) 2011 José Ramón Díaz - jrdiazweb@gmail.com
 *
 * http://3nibbles.blogspot.com/jquery-canvas-minimap.html
 * http://plugins.jquery.com/project/CanvasMinimap
 *
 * Container Minimap is a plugin that creates a minimap of the desired container
 * scaled down and styled so you can highlight the overall position of the
 * contents of the container element.
 *
 * Scale is calculated based on the minumum of width or height of the canvas used
 * to draw the minimap. So, using only CSS or attributes you can modify the scale
 * adjusting it to the desired size of the container.
 *
 * INSTANTIATION
 * Call the minimap method over the selector of the canvas where the minimap is
 * going to be drawn
 *
 *     minimapInstance = $('#myCanvas').minimap( $('myContainer') [, options] );
 *
 * The only HTML needed is the target canvas and the container to be drawn.
 *
 * OPTIONS
 *     - container : document.    Defaults to whole page. Otherwise is a
 *                                selector of the desired container to be mapped.
 *     - styles    : [ styleDef, ... ]    array with the styles to apply.
 *     - viewportStyle : styleDef. Style of the viewport.
 *     - viewportDragStyle: styleDef. Style of the viewport
 *
 * The OutlineStyle style must be in the following format (Same format than Fracs):
 *
 *     styleDef {
 *         // selector to use for that style
 *         selector: String / HTMLElement / [HTMLElement, ...] / jQuery
 *
 *         // border stroke width
 *         strokeWidth: float / undefined / 'auto'
 *
 *         // border color
 *         strokeStyle: String / undefined / 'auto'
 *
 *         // fill color
 *         fillStyle: String / undefined / 'auto'
 *     }
 *
 * strokeWidth, strokeColor, fillColor may have the special values
 * undefined to ignore and 'auto' to fetch values from css.
 *
 * PUBLIC API
 *     - $.minimap.redraw()    Redraws the minimap
 *     - drag                  Boolean that indicates that the viewport is being dragged
 *
 * Legal stuff
 *     Based on jQuery plugin named Fracs, but modified to allow minimapping of a
 *     desired container and some other enhancements.
 *
 *     You are free to use this code, but you must give credit and/or keep header intact.
 *     Please, tell me if you find it useful. An email will be enough.
 *     If you enhance this code or correct a bug, please, tell me.
 */
(function( $ ) {
 
 var $window   = $(window)
   , $document = $(document)
   ;
 
 ////////////////////////////////////////////////////////////////////////////////
    Rect = function (left, top, width, height) {
 
        if (!(this instanceof Rect)) {
            return new Rect(left, top, width, height);
        }
 
        this.left   = Math.round( left   );
        this.top    = Math.round( top    );
        this.width  = Math.round( width  );
        this.height = Math.round( height );
        this.right  = this.left + this.width;
        this.bottom = this.top  + this.height;
    };
 
    Rect.prototype = {
        equals: function( that ) {
            return this.left === that.left && this.top === that.top && this.width === that.width && this.height === that.height;
        },
 
        area: function() {
            return this.width * this.height;
        },
 
        intersection: function( rect ) {
            var left   = Math.max( this.left  , rect.left   ),
                right  = Math.min( this.right , rect.right  ),
                top    = Math.max( this.top   , rect.top    ),
                bottom = Math.min( this.bottom, rect.bottom ),
                width  = right  - left,
                height = bottom - top;
 
            return ( width >= 0 && height >= 0 ) ? Rect( left, top, width, height ) : undefined;
        },
 
        envelope: function( rect ) {
            var left   = Math.min( this.left  , rect.left   ),
                right  = Math.max( this.right , rect.right  ),
                top    = Math.min( this.top   , rect.top    ),
                bottom = Math.max( this.bottom, rect.bottom ),
                width  = right  - left,
                height = bottom - top;
 
            return Rect( left, top, width, height );
        }
    };
 
 
    /**
     * Special constructors
     */
    Rect.ofDocument = function() {
        return Rect( 0, 0, $document.width(), $document.height() );
    };
 
    Rect.ofViewport = function() {
        return Rect( $window.scrollLeft(), $window.scrollTop(), $window.width(), $window.height() );
    };
 
    Rect.ofElement = function( element ) {
        var $element = $(element)
          , offset;
 
        if( !$element.is(":visible") ) {
            return Rect( 0, 0, -1, 0 );
        }
 
        offset = $element.offset();
        return Rect( offset.left, offset.top, $element.outerWidth(), $element.outerHeight() );
    };
 
    Rect.ofElementOS = function( element, contOffset ) {
        var $element = $(element)
          , offset;
 
        if( typeof contOffset === 'undefined' || !contOffset ) contOffset = { left: 0, top: 0 };
        if( !$element.is(":visible") ) {
            return Rect( 0, 0, -1, 0 );
        }
 
        offset = $element.offset();
        return Rect( offset.left - contOffset.left, offset.top - contOffset.top, $element.outerWidth(), $element.outerHeight() );
    };
 
 
 ////////////////////////////////////////////////////////////////////////////////
    // Instantiation
    $.fn.minimap = function( container, options ) {
 
     var contOffset;
 
     // Private members
     function MiniMap( canvas, container, options ) {
 
         if ( !(this instanceof MiniMap) ) {
             return new MiniMap( canvas, container, options );
         }
 
         if ( !canvas.nodeName || canvas.nodeName.toLowerCase() !== "canvas" ) {
             return undefined;
         }
 
         var me = this
           , $canvas    = $(canvas)
           , $container = $(container) || document
           , width      = $canvas.width()  || $canvas.attr("width")
           , height     = $canvas.height() || $canvas.attr("height")
           , context    = canvas.getContext("2d")
           , drag       = false
           , vpRect
           , scale
           ;
 
         options = $.extend( {}, $.fn.minimap.defaults, options );
 
      // ========================================================================
      // Public Members
         this.redraw = function() {
          // Gets the container offset to transform contents position
          contOffset = $(container).offset();
          if( !contOffset ) contOffset = { left: 0, top: 0 };
 
          // Gets the Rect of the container
          docRec = null;
    if( $container === document )
     docRect = Rect.ofDocument();
    else
     docRect = Rect.ofElement( $container );
    vpRect = Rect.ofViewport();
    scale = Math.min(width / docRect.width, height / docRect.height);
 
    // Scales canvas on size and on inner transform
    $canvas.height( docRect.height * scale );
    $canvas.width(  docRect.width  * scale );
 
    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.clearRect( 0, 0, $canvas.width(), $canvas.height() );
 
    //context.scale( scale, scale ); // WRONG! deforms the projection
    context.scale( width / docRect.width, height / docRect.height );
 
    // Draws the minimap
    applyStyles();
    //drawViewport();
         },
 
         drawRect = function( rect, strokeWidth, strokeStyle, fillStyle, invert ) {
          // Draws a Rect on canvas
             if ( strokeStyle || fillStyle ) {
                 if (fillStyle) {
                     context.beginPath();
                     if (invert) {
                         context.rect( 0, 0, docRect.width, rect.top );
                         context.rect( 0, rect.top, rect.left, rect.height );
                         context.rect( rect.right, rect.top, docRect.right - rect.right, rect.height );
                         context.rect( 0, rect.bottom, docRect.width, docRect.bottom - rect.bottom );
                     } else {
                         context.rect( rect.left, rect.top, rect.width, rect.height );
                     }
                     context.fillStyle = fillStyle;
                     context.fill();
                 }
                 if (strokeStyle) {
                     context.beginPath();
                     context.rect( rect.left, rect.top, rect.width, rect.height );
                     context.lineWidth = scale ? Math.max( strokeWidth, 0.2 / scale ) : strokeWidth;
                     context.strokeStyle = strokeStyle;
                     context.stroke();
                 }
             }
         },
 
         drawElement = function( element, strokeWidth, strokeStyle, fillStyle ) {
          // Gets the Rect of an element and draws it on canvas
             var $element = $(element),
                 rect = Rect.ofElementOS( element, contOffset );
              //rect = Rect.ofElement( element );
 
             if ($element.css("visibility") === "hidden" || rect.width === 0 || rect.height === 0) {
                 return;
             }
 
             strokeWidth = strokeWidth === "auto" ? parseInt($element.css("border-top-width"), 10) : strokeWidth;
             strokeStyle = strokeStyle === "auto" ? $element.css("border-top-color") : strokeStyle;
             fillStyle   = fillStyle   === "auto" ? $element.css("background-color") : fillStyle;
             drawRect(rect, strokeWidth, strokeStyle, fillStyle);
         },
 
         applyStyles = function () {
          // Loops through the contents of the container
             $.each( options.styles, function (idx, style) {
                 $(style.selector).each(function () {
                     drawElement( this, style.strokeWidth, style.strokeStyle, style.fillStyle );
                 });
             });
         },
 
         drawViewport = function () {
             var style = drag && options.viewportDragStyle ? options.viewportDragStyle : options.viewportStyle;
 
             drawRect( vpRect, style.strokeWidth, style.strokeStyle, style.fillStyle, options.invertViewport );
         };
 
         me.redraw();
     }
 
        return new MiniMap( this.get(0), container, options );
    };
 
    // ========================================================================
    // Minimap options defaults
    $.fn.minimap.defaults = {
        container  : document,        // Defaults to whole page. Otherwise is a selector of the container
        styles     : [{               // Sample styles
                      selector: "header,footer,section,article",
                      fillStyle: "rgb(230,230,230)"
                     }, {
                      selector: "h1",
                      fillStyle: "rgb(240,140,060)"
                     }, {
                      selector: "h2",
                      fillStyle: "rgb(200,100,100)"
                     }, {
                      selector: "h3",
                      fillStyle: "rgb(100,200,100)"
                     }, {
                      selector: "h4",
                      fillStyle: "rgb(100,100,200)"
                     }]
    };
 
}(jQuery));
