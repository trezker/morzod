function test_logout() {
	ajax_post({'model': 'user', 'method': 'logout'}, function(data) {
		test_assert(data == true);
		ajax_post({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
			test_assert(data == false);
		});
	});
}

function test_login_password() {
	ajax_post({
		'model': 'user', 
		'method': 'login_password',
		'password': 'testpass',
		'username': 'testuser'
	}, function(data) {
		test_assert(data == true);
		ajax_post({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
			test_assert(data != false);
		});
	});
}

test_logout();
test_login_password();
