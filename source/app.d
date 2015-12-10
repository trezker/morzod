//import std.stdio;
import std.c.stdlib;
import std.file;
import std.json;
import vibe.d;
import ddbc.core;
import ddbc.common;
import ddbc.drivers.mysqlddbc;
import ddbc.pods;

shared static this() {
	runTask({
		if(!databaseSetup()) {
			logInfo("Database setup failed.");
			exit(-1);
		}
	});
	

	auto settings = new HTTPServerSettings;
	settings.port = 8080;
	settings.bindAddresses = ["::1", "127.0.0.1"];
	settings.errorPageHandler = toDelegate(&errorPage);

	auto router = new URLRouter;
	router.get("/", &index);
	router.post("/ajax", &ajax);
	router.get("/*", serveStaticFiles("./public/"));
	
	listenHTTP(settings, router);

	logInfo("Please open http://127.0.0.1:8080/ in your browser.");
}

bool databaseSetup() {
	try
	{
		if(!exists("database.json")) {
			logInfo("Missing database.json");
			return false;
		}
		string json = readText("database.json");
		logInfo(json);
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
		// create connection pool
		DataSource ds = new ConnectionPoolDataSourceImpl(driver, url, params);
		// creating Connection
		auto conn = ds.getConnection();
		scope(exit) conn.close();
		// creating Statement
		auto stmt = conn.createStatement();
		scope(exit) stmt.close();
		// reading DB
		auto rs = stmt.executeQuery("select id, name, pass, salt, created from user;");
		while (rs.next())
		    logInfo(to!string(rs.getString("name")));
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
			case "test":
				res.writeJsonBody(true);
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
