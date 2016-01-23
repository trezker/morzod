module morzod.server;

import vibe.http.server;
import ddbc.core;
import ddbc.common;
import ddbc.drivers.mysqlddbc;
import ddbc.pods;
import morzod.user;
import std.algorithm;
import vibe.core.log;
import std.file;
import std.json;
import std.functional;
import std.conv;
import vibe.http.websockets : WebSocket;
import vibe.core.core : sleep;
import core.time;

alias Request_delegate = void delegate(HTTPServerRequest req, HTTPServerResponse res);
struct Model_method {
	//List of access rights allowed to use method
	string[] access;
	Request_delegate method;

	void call(HTTPServerRequest req, HTTPServerResponse res, string[] user_access = []) {
		//If any access matches any user_access, call method, else error.
		//A method with empty access list is considered public.
		if(access.length == 0 || findAmong(access, user_access).length > 0) {
			method(req, res);
		}
		else {
			res.writeJsonBody("User has no access to method.");
		}
	}
}

class Morzo_server {
private:
	DataSource datasource;
	User_model user_model;
	Model_method[string][string] models;
	
public:
	bool setup() {
		if(!databaseSetup()) {
			logInfo("Database setup failed.");
			return false;
		}

		user_model = new User_model;
		user_model.setup(datasource, models);
		return true;
	}

	bool databaseSetup() {
		try
		{
			if(!exists("database.json")) {
				logInfo("Missing database.json");
				return false;
			}
			string json = readText("database.json");
			JSONValue[string] document = parseJSON(json).object;
			JSONValue[string] settings = document["dev"].object;
			auto host = settings["host"].str;
			auto port = to!ushort(settings["port"].integer);
			auto database = settings["database"].str;
			auto user = settings["user"].str;
			auto password = settings["password"].str;

			auto driver = new MySQLDriver();
		    auto url = MySQLDriver.generateUrl(host, port, database);
		    auto params = MySQLDriver.setUserAndPassword(user, password);
			datasource = new ConnectionPoolDataSourceImpl(driver, url, params);
		}
		catch(Exception e) {
			logInfo(e.msg);
		}
	    return true;
	}

	void errorPage(HTTPServerRequest req, HTTPServerResponse res, HTTPServerErrorInfo error) {
		res.render!("error.dt", req, error);
	}

	void index(HTTPServerRequest req, HTTPServerResponse res) {
		res.render!("index.dt", req);
	}

	void test(HTTPServerRequest req, HTTPServerResponse res) {
		res.render!("test.dt", req);
	}

	void ajax(HTTPServerRequest req, HTTPServerResponse res) {
		try {
			string model = req.json.model.to!string;
			string method = req.json.method.to!string;
			if(model in models && method in models[model]) {
				models[model][method].call (req, res);
			}
			else {
				res.writeJsonBody("Model/method does not exist");
			}
		}
		catch(Exception e) {
			logInfo(e.msg);
		}
	}
	
	void websocket(scope WebSocket socket) {
		int counter = 0;
		logInfo("Got new web socket connection.");
		while (true) {
			sleep(1.seconds);
			if (!socket.connected) break;
			counter++;
			logInfo("Sending '%s'.", counter);
			socket.send(counter.to!string);
		}
		logInfo("Client disconnected.");
	}

	void daemon() {
		while (true) {
			sleep(1.seconds);
			//logInfo("Daemon");
		}
	}
}
