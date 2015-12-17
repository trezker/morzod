function load_front() {
	ajax_post({'func': 'get_user'}, function(data) {
		alert(data);
	});
	ajax_html('/html/front.html', function(data) {
		$('body').html(data);
	});
}
