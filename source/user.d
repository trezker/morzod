module morzod.user;

import vibe.http.server;
import ddbc.core;
import morzod.server;

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
		models["user"]["logout"] = Model_method(
			[],
			&this.logout
		);
	}

	void get_current_user_id(HTTPServerRequest req, HTTPServerResponse res) {
		if(!req.session) {
			res.writeJsonBody(false);
			return;
		}
		auto id = req.session.get!int("id");
		res.writeJsonBody(id);
	}

	void login_password(HTTPServerRequest req, HTTPServerResponse res) {
		auto session = res.startSession();
		session.set("id", 1);
		//session.set("username", req.form["username"]);
		//session.set("password", req.form["password"]);
		res.writeJsonBody(true);
	}

	void logout(HTTPServerRequest req, HTTPServerResponse res) {
		if(req.session) {
			res.terminateSession();
		}
		res.writeJsonBody(true);
	}
}