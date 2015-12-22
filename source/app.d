//import std.stdio;
import std.c.stdlib;
import std.file;
import std.json;
import std.functional;
import std.conv;
import vibe.appmain;
import vibe.core.core;
import vibe.core.log;
import vibe.http.router;
import vibe.http.server;
import vibe.http.fileserver;
import ddbc.core;
import ddbc.common;
import ddbc.drivers.mysqlddbc;
import ddbc.pods;
import morzod;

class Morzo_server {
private:
	DataSource datasource;
	User_model user_model;
	alias Model_callback = void delegate(HTTPServerRequest req, HTTPServerResponse res);
	Model_callback[string][string] models;
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

	void ajax(HTTPServerRequest req, HTTPServerResponse res) {
		try {
			string model = req.json.model.to!string;
			string method = req.json.method.to!string;
			if(model in models && method in models[model]) {
				models[model][method] (req, res);
			}
			else {
				res.writeJsonBody("Model/method does not exist");
			}
			/*
			switch(func) {
				case "get_user":
					auto conn = datasource.getConnection();
					scope(exit) conn.close();

					auto prep = conn.prepareStatement("
						select id, name, created 
						from user 
						where id=?;
					");
					scope(exit) prep.close();
					prep.setUlong(1, 2);
					auto rs = prep.executeQuery();

					int name;
					while (rs.next()) {
						name = to!int(rs.getInt("id"));
					}
					res.writeJsonBody(name);
					break;
			}
			*/
		}
		catch(Exception e) {
			logInfo(e.msg);
		}
	}
}

shared static this() {
	auto morzo_server = new Morzo_server;

	runTask({
		if(!morzo_server.setup()) {
			exit(-1);
		}
	});
	
	auto settings = new HTTPServerSettings;
	settings.port = 8080;
	settings.bindAddresses = ["::1", "127.0.0.1"];
	settings.errorPageHandler = toDelegate(&morzo_server.errorPage);

	auto router = new URLRouter;
	router.get("/", &morzo_server.index);
	router.post("/ajax", &morzo_server.ajax);
	router.get("/*", serveStaticFiles("./public/"));
	
	listenHTTP(settings, router);

	logInfo("Please open http://127.0.0.1:8080/ in your browser.");
}
