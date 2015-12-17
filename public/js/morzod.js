$(function() {
	$.getScript("/js/front.js")
	.done(function( script, textStatus ) {
		load_front();
	});
});

function ajax_post(data, done) {
	$.ajax({
		method		: "POST",
		dataType   	: 'json',
		contentType	: 'application/json; charset=UTF-8',
		url: "/ajax",
		data: JSON.stringify(data)
	})
	.done(done);
}

function ajax_html(url, done) {
	$.ajax({
		method		: "GET",
		dataType   	: 'html',
		contentType	: 'application/json; charset=UTF-8',
		url: url
	})
	.done(done);
}