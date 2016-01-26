function load_front() {
	ajax_post({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
		if(data == false) {
			ajax_html('/html/login_page.html', function(data) {
				$('body').html(data);
				setup_ajax_form($('form#login'), function(data) {
					if(data == true) {
						$.getScript("/js/desktop.js")
						.done(function( script, textStatus ) {
							load_desktop();
						});
					}
					console.log(data);
				});
				setup_ajax_form($('form#create_account'), function(data) {
					console.log(data);
				});
			});
		}
		else {
			$.getScript("/js/desktop.js")
			.done(function( script, textStatus ) {
				load_desktop();
			});
		}
	});
}
