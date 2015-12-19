//import std.stdio;
import std.c.stdlib;
import std.file;
import std.json;
import vibe.d;
import ddbc.core;
import ddbc.common;
import ddbc.drivers.mysqlddbc;
import ddbc.pods;

class Morzo_server {
private:
	DataSource datasource;
public:
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
			string func = req.json.func.to!string;
			switch(func) {
				case "get_current_user_id":
					res.writeJsonBody(false);
					break;
				case "login_password":
					res.writeJsonBody("Woop");
					break;
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
				default:
					res.writeJsonBody(false);
					break;
			}
		}
		catch(Exception e) {
			logInfo(e.msg);
		}
	}
}

shared static this() {
	auto morzo_server = new Morzo_server;

	runTask({
		if(!morzo_server.databaseSetup()) {
			logInfo("Database setup failed.");
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
