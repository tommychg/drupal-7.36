Drupal.locale = { 'pluralFormula': function ($n) { return Number(($n>1)); }, 'strings': {"":{"Configure":"\u8a2d\u7f6e","Show":"\u986f\u793a","Enabled":"\u555f\u7528","Edit":"\u7de8\u8f2f","Select all rows in this table":"\u9078\u53d6\u8868\u683c\u4e2d\u7684\u6240\u6709\u5217","Deselect all rows in this table":"\u53d6\u6d88\u9078\u53d6\u8868\u683c\u4e2d\u7684\u6240\u6709\u5217","Disabled":"\u505c\u7528","Please wait...":"\u8acb\u7a0d\u7b49..."}} };;
(function ($) {

/**
 * Handle the concept of a fixed number of slots.
 *
 * This behavior is dependent on the tableDrag behavior, since it uses the
 * objects initialized in that behavior to update the row.
 */
Drupal.behaviors.shortcutDrag = {
  attach: function (context, settings) {
    if (Drupal.tableDrag) {
      var table = $('table#shortcuts'),
        visibleLength = 0,
        slots = 0,
        tableDrag = Drupal.tableDrag.shortcuts;
      $('> tbody > tr, > tr', table)
        .filter(':visible')
          .filter(':odd').filter('.odd')
            .removeClass('odd').addClass('even')
          .end().end()
          .filter(':even').filter('.even')
            .removeClass('even').addClass('odd')
          .end().end()
        .end()
        .filter('.shortcut-slot-empty').each(function(index) {
          if ($(this).is(':visible')) {
            visibleLength++;
          }
          slots++;
        });

      // Add a handler for when a row is swapped.
      tableDrag.row.prototype.onSwap = function (swappedRow) {
        var disabledIndex = $(table).find('tr').index($(table).find('tr.shortcut-status-disabled')) - slots - 2,
          count = 0;
        $(table).find('tr.shortcut-status-enabled').nextAll(':not(.shortcut-slot-empty)').each(function(index) {
          if (index < disabledIndex) {
            count++;
          }
        });
        var total = slots - count;
        if (total == -1) {
          var disabled = $(table).find('tr.shortcut-status-disabled');
          // To maintain the shortcut links limit, we need to move the last
          // element from the enabled section to the disabled section.
          var changedRow = disabled.prevAll(':not(.shortcut-slot-empty)').not($(this.element)).get(0);
          disabled.after(changedRow);
          if ($(changedRow).hasClass('draggable')) {
            // The dropped element will automatically be marked as changed by
            // the tableDrag system. However, the row that swapped with it
            // has moved to the "disabled" section, so we need to force its
            // status to be disabled and mark it also as changed.
            var changedRowObject = new tableDrag.row(changedRow, 'mouse', false, 0, true);
            changedRowObject.markChanged();
            tableDrag.rowStatusChange(changedRowObject);
          }
        }
        else if (total != visibleLength) {
          if (total > visibleLength) {
            // Less slots on screen than needed.
            $('.shortcut-slot-empty:hidden:last').show();
            visibleLength++;
          }
          else {
            // More slots on screen than needed.
            $('.shortcut-slot-empty:visible:last').hide();
            visibleLength--;
          }
        }
      };

      // Add a handler so when a row is dropped, update fields dropped into new regions.
      tableDrag.onDrop = function () {
        tableDrag.rowStatusChange(this.rowObject);
        return true;
      };

      tableDrag.rowStatusChange = function (rowObject) {
        // Use "status-message" row instead of "status" row because
        // "status-{status_name}-message" is less prone to regexp match errors.
        var statusRow = $(rowObject.element).prevAll('tr.shortcut-status').get(0);
        var statusName = statusRow.className.replace(/([^ ]+[ ]+)*shortcut-status-([^ ]+)([ ]+[^ ]+)*/, '$2');
        var statusField = $('select.shortcut-status-select', rowObject.element);
        statusField.val(statusName);
      };

      tableDrag.restripeTable = function () {
        // :even and :odd are reversed because jQuery counts from 0 and
        // we count from 1, so we're out of sync.
        // Match immediate children of the parent element to allow nesting.
        $('> tbody > tr:visible, > tr:visible', this.table)
          .filter(':odd').filter('.odd')
            .removeClass('odd').addClass('even')
          .end().end()
          .filter(':even').filter('.even')
            .removeClass('even').addClass('odd');
      };
    }
  }
};

/**
 * Make it so when you enter text into the "New set" textfield, the
 * corresponding radio button gets selected.
 */
Drupal.behaviors.newSet = {
  attach: function (context, settings) {
    var selectDefault = function() {
      $(this).closest('form').find('.form-item-set .form-type-radio:last input').attr('checked', 'checked');
    };
    $('div.form-item-new input').focus(selectDefault).keyup(selectDefault);
  }
};

})(jQuery);
;
(function ($) {

Drupal.toolbar = Drupal.toolbar || {};

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context) {

    // Set the initial state of the toolbar.
    $('#toolbar', context).once('toolbar', Drupal.toolbar.init);

    // Toggling toolbar drawer.
    $('#toolbar a.toggle', context).once('toolbar-toggle').click(function(e) {
      Drupal.toolbar.toggle();
      // Allow resize event handlers to recalculate sizes/positions.
      $(window).triggerHandler('resize');
      return false;
    });
  }
};

/**
 * Retrieve last saved cookie settings and set up the initial toolbar state.
 */
Drupal.toolbar.init = function() {
  // Retrieve the collapsed status from a stored cookie.
  var collapsed = $.cookie('Drupal.toolbar.collapsed');

  // Expand or collapse the toolbar based on the cookie value.
  if (collapsed == 1) {
    Drupal.toolbar.collapse();
  }
  else {
    Drupal.toolbar.expand();
  }
};

/**
 * Collapse the toolbar.
 */
Drupal.toolbar.collapse = function() {
  var toggle_text = Drupal.t('Show shortcuts');
  $('#toolbar div.toolbar-drawer').addClass('collapsed');
  $('#toolbar a.toggle')
    .removeClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').removeClass('toolbar-drawer').css('paddingTop', Drupal.toolbar.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    1,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

/**
 * Expand the toolbar.
 */
Drupal.toolbar.expand = function() {
  var toggle_text = Drupal.t('Hide shortcuts');
  $('#toolbar div.toolbar-drawer').removeClass('collapsed');
  $('#toolbar a.toggle')
    .addClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').addClass('toolbar-drawer').css('paddingTop', Drupal.toolbar.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    0,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

/**
 * Toggle the toolbar.
 */
Drupal.toolbar.toggle = function() {
  if ($('#toolbar div.toolbar-drawer').hasClass('collapsed')) {
    Drupal.toolbar.expand();
  }
  else {
    Drupal.toolbar.collapse();
  }
};

Drupal.toolbar.height = function() {
  var $toolbar = $('#toolbar');
  var height = $toolbar.outerHeight();
  // In modern browsers (including IE9), when box-shadow is defined, use the
  // normal height.
  var cssBoxShadowValue = $toolbar.css('box-shadow');
  var boxShadow = (typeof cssBoxShadowValue !== 'undefined' && cssBoxShadowValue !== 'none');
  // In IE8 and below, we use the shadow filter to apply box-shadow styles to
  // the toolbar. It adds some extra height that we need to remove.
  if (!boxShadow && /DXImageTransform\.Microsoft\.Shadow/.test($toolbar.css('filter'))) {
    height -= $toolbar[0].filters.item("DXImageTransform.Microsoft.Shadow").strength;
  }
  return height;
};

})(jQuery);
;
