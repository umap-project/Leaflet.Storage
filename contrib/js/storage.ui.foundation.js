/*
* Optionaly include this file if you are using Foundation framework.
* You need a <div id="storage-ui-container"></div> at the bottom of your
* HTML page.
*/
$(document).foundationAlerts();
/*
* Modals
*/
L.Storage.on('ui:start', function (e) {
    var $div = $('#storage-ui-container');
    // reset class
    $div.attr("class", "");
    $div.addClass("reveal-modal");
    if (e.cssClass) {
        $div.addClass(e.cssClass);
    }
    // in case a modal is already opened with same id, unbind
    $div.unbind('.reveal');
    return $div.empty().html(e.data.html).append('<a class="close-reveal-modal">&#215;</a>').reveal();
});
L.Storage.on('ui:end', function (e) {
    var $div = $('#storage-ui-container');
    if ($div) {
        $div.trigger('reveal:close');
    }
});
$('a.reveal').click(function(e) {
  // Generic reveal from ajax call
  e.preventDefault();
  var $this = $(this);
  var options = {};
  if ($this.data('listenForm')) {
      options.listen_form = {
          id: $this.data('listenForm')
      };
  }
  L.Storage.Xhr.get($this.attr('href'), options);
});
/*
* Alerts
*/
L.Storage.on('ui:alert', function (e) {
    var level_class = e.level && e.level == "info"? "success": "alert";
    $div = $('<div>').addClass('alert-box global').addClass(level_class).html(e.content);
    $div.append('<a href="#" class="close">&times;</a>');
    $("body").prepend($div);
});
/*
* Login/logout buttons
*/
$(document).ready(function(e){
  $('a.login_button').click(function (e) {
    e.preventDefault();
    var $this = $(this);
    L.Storage.Xhr.login({
      "login_required": $this.attr('href'),
      "redirect": "/"
    });
  });
});
$(document).ready(function(e){
  $('a.logout_button').click(function (e) {
    e.preventDefault();
    var $this = $(this);
    L.Storage.Xhr.logout($this.attr('href'));
  });
});
