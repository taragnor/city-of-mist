import { Logger } from "./tools/logger.mjs";

export class CityLogger extends Logger {

	static async logToChat(actor, action, object = null, aftermsg = "") {
		if (action != undefined) {
			const object_part = object ? `${object.type} ${object.getDisplayedName()}` : "";
			const after_message = aftermsg ? `(${aftermsg})` : "";
			const message = await renderTemplate("systems/city-of-mist/templates/modification-log-post.hbs", {object_part, after_message, actor, action});
			await this.gmMessage(message, null);
		} else {
			console.warn(`Deprecated usage of modification Log: ${actor}`);
			await this.gmMessage(actor);
		}
	}

	static async modificationLog(...args) {
		if (!game.settings.get("city-of-mist", "loggedActions"))
			return;
		await this.logToChat(...args);
	}

	static async rawHTMLLog(actor, html) {
		await this.gmMessage(html, actor);
	}

}
