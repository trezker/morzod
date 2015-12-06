function test() {
	var data = {
		func: "test"
	};
	$.ajax({
		method		: "POST",
		dataType   	: 'json',
		contentType	: 'application/json; charset=UTF-8',
		url: "/ajax",
		data: JSON.stringify(data)
	})
	.done(function(data) {
		alert(data);
	});
}

$(function() {
	$("#test").on("click", function(e) {
		test();
	});
});
