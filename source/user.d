module morzod.user;

import vibe.http.server;
import ddbc.core;
import morzod.server;

alias Request_delegate = void delegate(HTTPServerRequest req, HTTPServerResponse res);

class User_model {
	DataSource datasource;

	void setup(DataSource ds, ref Model_method[string][string] models) {
		datasource = ds;
		models["user"]["get_current_user_id"] = Model_method(
			[],
			&this.get_current_user_id
		);
		models["user"]["login_password"] = Model_method(
			[],
			&this.login_password
		);
	}

	void get_current_user_id(HTTPServerRequest req, HTTPServerResponse res) {
		res.writeJsonBody(false);
	}

	void login_password(HTTPServerRequest req, HTTPServerResponse res) {
		res.writeJsonBody(false);
	}
}