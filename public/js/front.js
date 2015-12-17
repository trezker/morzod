function load_front() {
	ajax_html('/html/front.html', function(data) {
		$('body').html(data);
	});
}
