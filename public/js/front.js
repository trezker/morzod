function load_front() {
	ajax_post({'model': 'user', 'method': 'get_current_user_id'}, function(data) {
		if(data == false) {
			ajax_html('/html/login_page.html', function(data) {
				$('body').html(data);
				setup_ajax_form($('form#login'), function(data) {
					if(data == true) {
						load_desktop();
					}
					console.log(data);
				});
				setup_ajax_form($('form#create_account'), function(data) {
					console.log(data);
				});
			});
		}
		else {
			//TODO: Show front page for a logged in user
			load_desktop();
		}
	});
}

function load_desktop() {
	ajax_html('/html/desktop.html', function(data) {
		$('body').html(data);

		$(".flex-container").sortable().disableSelection();
		$("#disablesort").on("click", function(){
			$(".flex-container").sortable( "disable" ).enableSelection();;
		});
		$("#enablesort").on("click", function(){
			$(".flex-container").sortable("enable").disableSelection();;
		});

		var n = 0;
		$("#add").on('click', function() {
			n++;
			$(".flex-container").append('<div class="flex-item">' + n + '</div>');
		});

		$("#logout").on('click', function() {
			ajax_post({
				'model': 'user', 
				'method': 'logout'
			}, function(data) {
				load_front();
			});
		});
	});
}