import std.c.stdlib;
import std.functional;
import vibe.appmain;
import vibe.core.core;
import vibe.core.log;
import vibe.http.router;
import vibe.http.fileserver;
import morzod.server;

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
	settings.sessionStore = new MemorySessionStore;

	auto router = new URLRouter;
	router.get("/", &morzo_server.index);
	router.get("/test", &morzo_server.test);
	router.post("/ajax*", &morzo_server.ajax);
	router.get("/*", serveStaticFiles("./public/"));
	
	listenHTTP(settings, router);

	logInfo("Please open http://127.0.0.1:8080/ in your browser.");
}
