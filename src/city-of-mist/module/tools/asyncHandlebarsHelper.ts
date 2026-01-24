import { CityHelpers } from "../city-helpers.js";

let idNum = 0;
export function AsyncHandleBarsHelper(promise: Promise<string>):  SafeString {
	const element_id = `temp-prefix-${idNum++}`;
	let item_html : string | undefined = undefined;
	void promise.then( async (data) => {
		item_html = data;
		const WAITAMT = 0.01;
		let totalWait = 0;
		while ($('span#' + element_id).length == 0) {
			totalWait += WAITAMT;
			await CityHelpers.asyncwait(WAITAMT);
			if (totalWait > 30) {
				const msg = `timeout: can't find element id ${element_id}`;
				ui.notifications.error(msg);
				throw new Error(msg);
			}
		}
		$('span#' + element_id).replaceWith(data);
	});
	if(item_html){//cache resolved immediately
		return item_html;
	}
	return new Handlebars.SafeString('<span id="' + element_id + '">Loading..</span>');
}

