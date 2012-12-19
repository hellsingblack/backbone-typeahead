/* =============================================================
 * bootstrap-typeahead-backbone.js v2.0.0
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * https://github.com/twitter/bootstrap/blob/master/js/bootstrap-typeahead.js
 * Modified by Marius Andreiana to work with Backbone Collection, Model, View
 * - custom results formatting
 * - custom behavior on selected item (Model with complex information)
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ){

  "use strict"

  var TypeaheadBackbone = function ( element, options ) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeaheadBackbone.defaults, options)
    this.collection = this.options.collection
    this.collection.on('reset', this.onCollectionReset, this);

    this.fetchURL = this.options.fetchURL

    this.template = _.template(this.options.template); //string parameter -> compiled version
    this.pubsub = this.options.pubsub;
    this.selectEvent = this.options.selectEvent;
    this.$menu = $(this.options.menu).appendTo('body')
    //console.log(this.$menu);
    this.shown = false

    this.lookupThrottled = _.throttle(this.lookup, 500);

    this.listen()
  }

  TypeaheadBackbone.prototype = {

    constructor: TypeaheadBackbone

  , select: function () {
	  var selectedItem = this.$menu.find('.active')[0];
	  var index = this.$menu.find("li").index(selectedItem);
      this.$element.val("");
      this.hide();
      this.pubsub.trigger(this.selectEvent, this.collection.at(index));
      //console.log(this.collection.at(0).toJSON() );
    }

  , show: function () {
      var pos = $.extend({}, this.$element.offset(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu.css({
        top: pos.top + pos.height
      , left: pos.left
      })

      this.$menu.show()
      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , onCollectionReset: function () {
	  //console.log("onCollectionReset");
	  //console.log(this.collection);

	  items = this.collection.map(function (item) {
		  //console.log(item.toJSON());
		//make template a jquery object so it can be used later, but return 1st element instead of array
	        return $(this.template(item.toJSON()))[0];
	      }, this);


	  //console.log(items);
	  items = $(items); // so we can use first()
	  items.first().addClass('active');
	  this.$menu.html(items)
	  //console.log(items);

	  if (!items.length) {
	        return this.shown ? this.hide() : this
	  }
	  this.show();

    }

  , lookup: function (event) {
      var that = this
        , items
        , q

      this.query = this.$element.val()

      if (!this.query || this.query.length < 4) {
        return this.shown ? this.hide() : this
      }

      this.collection.url = this.fetchURL + encodeURIComponent(this.query);
      this.collection.fetch();

    }


  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if ($.browser.webkit || $.browser.msie) {
        this.$element.on('keydown', $.proxy(this.keypress, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
    }

  , keyup: function (e) {
      e.stopPropagation()
      e.preventDefault()

      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          this.hide()
          break

        default:
          this.lookupThrottled()
      }

  }

  , keypress: function (e) {
      e.stopPropagation()
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }
    }

  , blur: function (e) {
      var that = this
      e.stopPropagation()
      e.preventDefault()
      setTimeout(function () { that.hide() }, 150)
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
    }

  , mouseenter: function (e) {
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  $.fn.typeaheadBackbone = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeaheadBackbone')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeaheadBackbone', (data = new TypeaheadBackbone(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeaheadBackbone.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeaheadBackbone dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  }

  $.fn.typeaheadBackbone.Constructor = TypeaheadBackbone


 /* TYPEAHEAD DATA-API
  * ================== */

  $(function () {
    $('body').on('focus.typeaheadBackbone.data-api', '[data-provide="typeaheadBackbone"]', function (e) {
      var $this = $(this)
      if ($this.data('typeaheadBackbone')) return
      e.preventDefault()
      $this.typeaheadBackbone($this.data())
    })
  })

}( window.jQuery )