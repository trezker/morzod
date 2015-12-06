//import std.stdio;
import std.c.stdlib;
import std.file;
import vibe.d;
import ddbc.core;
import ddbc.common;
import ddbc.drivers.mysqlddbc;
import ddbc.pods;

shared static this() {
	if(!databaseSetup()) {
		exit(-1);
	}

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
	if(!exists("database.ini")) {
		logInfo("Missing database.ini");

		logInfo("Database setup failed.");
		return false;
	}
	auto driver = new MySQLDriver();
    auto url = MySQLDriver.generateUrl("localhost", 3306, "test_db");
    auto params = MySQLDriver.setUserAndPassword("root", "testpassword");
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
