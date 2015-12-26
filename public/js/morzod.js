$(function() {
	$.getScript("/js/front.js")
	.done(function( script, textStatus ) {
		load_front();
	});
});
