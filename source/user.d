module morzod.user;

import vibe.http.server;
import ddbc.core;
import morzod.server;
import vibe.core.log;
import morzod.helpers;

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
		models["user"]["create_user"] = Model_method(
			[],
			&this.create_user
		);
		models["user"]["delete_user"] = Model_method(
			[],
			&this.delete_user
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

	void create_user(HTTPServerRequest req, HTTPServerResponse res) {
		string username = req.json.username.to!string;
		string password = req.json.password.to!string;

		auto conn = datasource.getConnection();
		scope(exit) conn.close();

		//Check if username is taken
		auto prep = conn.prepareStatement("
			select 1 from user where name = ?
		");

		prep.setString(1, username);
		auto rs = prep.executeQuery();
		if(rs.next())
		{
			res.writeJsonBody(false);
			return;
		}

		//Create the user
		string salt = get_random_string(32);

		prep = conn.prepareStatement("
			insert into user(name, pass, salt)
			values(?, ?, ?)
		");
		scope(exit) prep.close();
		prep.setString(1, username);
		prep.setString(2, password);
		prep.setString(3, salt);
		prep.executeUpdate();

		res.writeJsonBody(true);
	}

	void delete_user(HTTPServerRequest req, HTTPServerResponse res) {
		string username = req.json.username.to!string;
		//Method only for testing, in real usage users are never deleted.
		if(username != "testuser")
		{
			res.writeJsonBody(true);
			return;
		}

		auto conn = datasource.getConnection();
		scope(exit) conn.close();

		auto prep = conn.prepareStatement("
			delete from user where name = ?
		");
		scope(exit) prep.close();
		prep.setString(1, username);
		prep.executeUpdate();

		res.writeJsonBody(true);
	}
}