function load_front() {
	ajax_post({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
		if(data == false) {
			ajax_html('/html/login_page.html', function(data) {
				$('body').html(data);
				setup_ajax_form($('form#login'), function(data) {
					console.log(data);
				});
			});
		}
		else {
			//TODO: Show front page for a logged in user
		}
	});
}
