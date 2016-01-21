function test_logout() {
	ajax_post_sync({'model': 'user', 'method': 'logout'}, function(data) {
		test_assert(data == true);
		ajax_post_sync({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
			test_assert(data == false);
		});
	});
}

function test_login_password() {
	ajax_post_sync({
		'model': 'user', 
		'method': 'create_user',
		'password': 'testpass',
		'username': 'testuser'
	}, function(data) {
		test_assert(data == true);
		ajax_post_sync({
			'model': 'user', 
			'method': 'login_password',
			'password': 'testpass',
			'username': 'testuser'
		}, function(data) {
			test_assert(data == true);
			ajax_post_sync({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
				test_assert(data != false);
				ajax_post_sync({
					'model': 'user', 
					'method': 'delete_user',
					'username': 'testuser'
				}, function(data) {
					test_assert(data == true);
				});
			});
		});
	});
}

function test_unique_username() {
	ajax_post_sync({
		'model': 'user', 
		'method': 'create_user',
		'password': 'testpass',
		'username': 'testuser'
	}, function(data) {
		ajax_post_sync({
			'model': 'user', 
			'method': 'create_user',
			'password': 'testpass',
			'username': 'testuser'
		}, function(data) {
			test_assert(data == false);
			ajax_post_sync({
				'model': 'user', 
				'method': 'delete_user',
				'username': 'testuser'
			}, function(data) {
				test_assert(data == true);
			});
		});
	});
}

test_logout();
test_login_password();
test_unique_username();
