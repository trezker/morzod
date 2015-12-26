function test_get_current_user_id_logged_out() {
	ajax_post({'model': 'user', 'method': 'logout'}, function(data) {
		test_assert(data == true);
	});
	ajax_post({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
		test_assert(data == false);
	});
}

test_get_current_user_id_logged_out();
