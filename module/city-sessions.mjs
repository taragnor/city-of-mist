import {MasterSession, SlaveSession} from "./sockets.mjs";
import {CityDialogs} from "./city-dialogs.mjs";
import {SelectedTagsAndStatus} from "./selected-tags.mjs";
import {ReviewableModifierList} from "./ReviewableModifierList.mjs";
import {CityHelpers} from "./city-helpers.js";
import { CityActor } from "./city-actor.js";


export class JuiceMasterSession extends MasterSession {
	/** getHTMLFn is a function that gets the JQuery object for the message and refreshFn is the function to call to refresh the power and such of the roll after adding the juice
	*/

	/** on update Fn is a handler Fn that takes ({ownerId, juiceId, direction, amount})
	*/
	constructor (onUpdateFn, actorId, moveId) {
		super();
		this.onUpdateFn = onUpdateFn;
		this.sendObj = {actorId, moveId};
	}

	get html() {
		return this.getHTMLFn();
	}

	setHandlers() {
		super.setHandlers();
		this.setReplyHandler("juice", this.onJuiceReply.bind(this));

	}


	async start() {
		this.registerSubscribers( game.users.filter( x=> !x.isGM));
		const result = await this.request("juice", this.sendObj);
		return result;

	}

	onJuiceReply({juiceOwnerId, direction, amount}, _meta, senderId) {
		this.onUpdateFn(juiceOwnerId, direction, amount);
	}

}

export class JuiceSlaveSession extends SlaveSession {

	setHandlers() {
		super.setHandlers();
		this.setRequestHandler("juice", this.onJuiceRequest.bind(this));
	}

	async onJuiceRequest( dataObj) {
		const character = game.user.character;
		if (!character) {
			throw new Error("Error: No Character");
		}
		try {
			const {direction, amount, actorId} = 	await CityDialogs.getHelpHurt(dataObj, this);
			this.dialog = null;
			return {
				amount,
				direction,
				juiceOwnerId: actorId,
			};
		} catch (err) {
			const msg=  "error in request";
			console.log(msg);
			throw new Error(msg);
		}
	}

	setDialog(dialog) { this.dialog = dialog;}

	onDestroy() {
		super.onDestroy();
		try {
			if (this.dialog)
				this.dialog.close();
		} catch (e) {
			console.error(e);
		}
		this.dialog = null;
	}

}


export class TagReviewMasterSession extends MasterSession {

	/** provide an initial taglist, and a moveId
taglist ois of the form {
tag: fullFormatTag,
state: string (status of tag (REjected, Accepted, pending, etc),
}
*/
	constructor( reviewableTagList, moveId, actor) {
		super();
		this.tagList = reviewableTagList;
		if (moveId == undefined)
			throw new Error("no move Id given");
		this.moveId = moveId;
		this.dialog = null;
		this.actor =actor;
	}

	setHandlers() {
		super.setHandlers();
		this.setReplyHandler("tagReview", this.onReply.bind(this));
		this.addNotifyHandler("updateTagList", this.onUpdateTagList.bind(this));
	}

	setDialog(dialog) {
		this.dialog  = dialog;
	}

	async start() {
		const gms = game.users.filter( x=> x.isGM && x.active);
		this.registerSubscribers(gms);
		// console.log(`GMs detected :${gms.length}`);
		if (gms.length == 0)
			return this.tagList;
		let state = "pending";
		let returnTagList;

		while (state != "approved") {
			try {
				const sendObj = this.sendObject;
				const results = await this.request("tagReview", sendObj);
				const result = results[0]?.value;
				if (!result) throw new Error("Empty result");
				// console.log(`Result Recieved: ${result?.state}`);
				state = result?.state;
				const returnTagList = ReviewableModifierList.fromSendableForm(result.tagList);
				this.tagList = returnTagList;
			} catch (e) {
				console.error(e);
				ui.notifications.error("Problem resolving result from Tag Verify");
				throw new Error("AAAHAHHH!!");
			}
		}
		return this.tagList;
	}

	get sendObject() {
		return {
			tagList: this.tagList.toSendableForm(),
			moveId: this.moveId,
			actorId: this.actor.id,
			tokenId: this.actor.tokenId,
		}
	}

	async updateList(reviewableList) {
		const obj  = {
			tagList: reviewableList.toSendableForm()
			};
		await this.notify("updateTagList", obj);

	}

	async onUpdateTagList(sendObj) {
		const {tagList} = sendObj;
		const reviewableList = ReviewableModifierList.fromSendableForm(tagList);
		if (this.dialog)
			this.dialog.setReviewList(reviewableList);
	}


	/**refreshs the list with a new list on the other end useful when something new gets added*/
	async updateTagList( list) {
		try {
			this.tagList = list;
			await this.notify("updateTagList", {
				tagList: this.simplifiedTagList,
			});
			return true;
		} catch (e) {
			console.log(`Add Item failed on ${tagOrStatus?.name}`);
			console.error(e);
		}
		return false;
	}

	onReply( dataObj, meta) {
		// console.log(`reply Recieved : ${dataObj?.state} `)
	}
}

export class TagReviewSlaveSession extends SlaveSession {
	setHandlers() {
		super.setHandlers();
		this.setRequestHandler("tagReview", this.onReviewRequest.bind(this));
		this.addNotifyHandler("updateTagList", this.onUpdateTagList.bind(this));
	}

	setDialog(dialog) {
		this.dialog  = dialog;
	}

	async updateList(reviewableList) {
		const obj  = {
			tagList: reviewableList.toSendableForm()
			};
		await this.notify("updateTagList", obj);

	}

	async onUpdateTagList(sendObj) {
		const {tagList} = sendObj;
		const reviewableList = ReviewableModifierList.fromSendableForm(tagList);
		if (this.dialog)
			this.dialog.setReviewList(reviewableList);
	}

	async onReviewRequest( dataObj) {
		const {actorId, tokenId} = dataObj;
		const tagList = ReviewableModifierList.fromSendableForm(dataObj.tagList);
		const moveId = dataObj.moveId;
		const actor = CityHelpers.getOwner(actorId, tokenId);
		const {tagList: reviewList, state} = await CityDialogs.tagReview(tagList, moveId, this, actor);
		const sendableTagList = reviewList.toSendableForm();
		return {
			tagList: sendableTagList,
			state
		};
	}

	async requestClarification	(itemId, ownerId) {
		const dataObj  = {
			itemId,
			ownerId,
			changeType: "request-clarification"
		};
		await this.notify("tagUpdate", dataObj);
	}

	async approveTag	(itemId, ownerId) {
		const dataObj  = {
			itemId,
			ownerId,
			changeType: "approved"
		};
		await this.notify("tagUpdate", dataObj);
	}

	async rejectTag	(itemId, ownerId) {
		const dataObj  = {
			itemId,
			ownerId,
			changeType: "rejected"
		};
		await this.notify("tagUpdate", dataObj);
	}

	onDestroy() {
		super.onDestroy();
		try {
			if (this.dialog)
				this.dialog.close();
		} catch (e) {
			console.error(e);
		}
		this.dialog = null;
	}

}

export class JuiceSpendingSessionM extends MasterSession {
	constructor (juiceId, ownerId, amount) {
		super();
		this.dataObj = { juiceId, ownerId, amount};
	}

	setHandlers() {
		super.setHandlers();
		this.setReplyHandler("spendJuice", this.onJuiceReply.bind(this));
	}

	onJuiceReply() {}

	async start() {
		const gm = game.users.find(x=> x.isGM && x.active);
		if (!gm) {
			ui.notifications.error("No GM found, can't spend juice");
			throw new Error("No GM found to spend juice!");
		}
		this.registerSubscribers([gm]);
		const result = await this.request("spendJuice", this.dataObj);
		return result;
	}
}

export class JuiceSpendingSessionS extends SlaveSession {
	setHandlers() {
		super.setHandlers();
		this.setRequestHandler("spendJuice", this.onSpendRequest.bind(this));
	}

	async onSpendRequest(data,_meta) {
		const{juiceId, ownerId, amount} = data
		const actor = game.actors.get(ownerId);
		if (actor) {
			const juice = await actor.getJuice(juiceId);
			await juice.spend(amount);
			return {confirm:true};
		} else {
			throw new Error("Couldn't find actor");
		}
	}
}

export class TagAndStatusCleanupSessionM extends MasterSession {
	constructor (commandString, itemId, ownerId, tokenId, burnState) {
		super();
		this.dataObj = {commandString, itemId, ownerId, tokenId, burnState};
	}

	setHandlers() {
		super.setHandlers();
		this.setReplyHandler("cleanupTagStatus", () => {});
	}

	async start() {
		const gm = game.users.find(x=> x.isGM && x.active);
		if (!gm) {
			ui.notifications.error("No GM found, can't spend juice");
			throw new Error("No GM found to spend juice!");
		}
		this.registerSubscribers([gm]);
		return await this.request("cleanupTagStatus", this.dataObj);
	}

}

export class TagAndStatusCleanupSessionS extends SlaveSession {
	setHandlers() {
		super.setHandlers();
		this.setRequestHandler("cleanupTagStatus", this.onCleanupRequest.bind(this));
	}

	async onCleanupRequest(data, _meta) {
		const {itemId, ownerId, tokenId, commandString, burnState} = data;
		const actor = CityHelpers.getOwner(ownerId, tokenId);
		const item = actor.items.find( x => x.id == itemId);
		if (item) {
			switch (commandString) {
				case "burn":
					await item.burnTag(burnState);
					break;
				case "delete":
					await item.deleteTemporary();
					break;
				default:
					throw new Error(`Unknown command ${commandString}`);
			}
			return {confirm: true};
		} else {
			throw new Error("Item Id ${itemId} not found on actorId ${ownerId}");
		}
	}
}

export class DowntimeSessionM extends MasterSession {

	/**
	@param {Array.<CityActor>} PCCharacterList
	*/
	constructor(PCCharacterList) {
		super();
		this.data = PCCharacterList.map( actor => {
			const owner = game.users
				.filter (x=> !x.isGM)
				.find ( user=> actor.testUserPermission(user, "OWNER") && user.active);
			return {
				actor,
				owner,
				reply: null
			};
		});
		this.data
			.filter(x => !x.owner)
			.forEach (x => { ui.notifications.warn(` ${x.actor.name} doesn't have an active owner`)});
		this.data = this.data.filter(x=> x.owner);
		this.users = [...new Set(this.data.map( x=> x.owner))];
	}

	setHandlers() {
		super.setHandlers();
		this.setRequestHandler("downtime", () => {});
	}

	async start() {
		if (this.users.length == 0) return [];
		this.registerSubscribers(this.users);
		const actors = this.users
			.flatMap( user=> this.data.filter( x=> x.owner == user))
		.map(x=>x.actor.id);
		return await this.request("downtime", actors);
	}

}

export class DowntimeSessionS extends SlaveSession {
	setHandlers() {
		super.setHandlers();
		this.setRequestHandler("downtime", this.onDowntimeRequest.bind(this));
	}

	async onDowntimeRequest(actorIdList, _meta) {
		let replyObj = actorIdList.map( id => ({
			actorId:id,
			downtimeAction: null
		}));
		console.log(actorIdList);
		const actorList = actorIdList.map ( id =>
			game.actors.get(id)
		);
		for (const actor of actorList) {
			const choice = await CityDialogs.DowntimePCSelector(actor);
			replyObj.find( x=> x.actorId == actor.id).downtimeAction = choice;
		}
		return replyObj;
	}

}

