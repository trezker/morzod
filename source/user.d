module morzod;

import vibe.http.server;
import ddbc.core;

alias Model_callback = void delegate(HTTPServerRequest req, HTTPServerResponse res);

class User_model {
	DataSource datasource;

	void setup(DataSource ds, ref Model_callback[string][string] models) {
		datasource = ds;
		models["user"]["get_current_user_id"] = &this.get_current_user_id;
		models["user"]["login_password"] = &this.login_password;
	}

	void get_current_user_id(HTTPServerRequest req, HTTPServerResponse res) {
		res.writeJsonBody(false);
	}

	void login_password(HTTPServerRequest req, HTTPServerResponse res) {
		res.writeJsonBody(false);
	}
}