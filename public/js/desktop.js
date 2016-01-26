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

		$('#mapgenerator').on('click', function() {
			//TODO: Load world generator html and js from file.
			//http://learningwebgl.com/blog/?page_id=1217
			$.getScript("/js/mapgenerator.js")
			.done(function( script, textStatus ) {
				load_mapgenerator();
			});
		});
	});
}
