import { TagReviewDialog } from "./dialogs/tag-review.js";
import { Tag } from "./city-item.js";
import { CityItem } from "./city-item.js";
import { RollDialog } from "./roll-dialog.js";
import { SendableItem } from "./ReviewableModifierList.js";
	import {MasterSession, SlaveSession} from "./sockets.js";
import {CityDialogs} from "./city-dialogs.js";
import {ReviewableModifierList} from "./ReviewableModifierList.js";
import {CityHelpers} from "./city-helpers.js";
import { CityActor } from "./city-actor.js";


export class JuiceMasterSession extends MasterSession {

	sendObj: {actorId: string, moveId: string};
	onUpdateFn: (ownerId: string, direction: number, amount: number) => void;

	/** on update Fn is a handler Fn that takes ({ownerId, juiceId, direction, amount})
	*/
	constructor (onUpdateFn: (ownerId: string, direction: number, amount: number) => void, actorId: string, moveId: string) {
		super();
		this.onUpdateFn = onUpdateFn;
		this.sendObj = {actorId, moveId};
	}

	/** getHTMLFn is a function that gets the JQuery object for the message and refreshFn is the function to call to refresh the power and such of the roll after adding the juice
	*/
	// get html() {
	// 	return this.getHTMLFn();
	// }

	override setHandlers() {
		super.setHandlers();
		this.setReplyHandler("juice", this.onJuiceReply.bind(this));

	}


	override async start() {
		this.registerSubscribers( game.users.filter( x=> !x.isGM));
		const result = await this.request("juice", this.sendObj);
		return result;

	}

	onJuiceReply({juiceOwnerId, direction, amount}: {juiceOwnerId: string, direction: number, amount: number}, _meta: unknown, _senderId: string) {
		this.onUpdateFn(juiceOwnerId, direction, amount);
	}

}

export class JuiceSlaveSession extends SlaveSession {

	dialog: Dialog | null;

	override setHandlers() {
		super.setHandlers();
	}

	override setRequestHandlers() {
		this.setRequestHandler("juice", this.onJuiceRequest.bind(this));
	}

	async onJuiceRequest( dataObj : {actorId: string, actorName:string, moveId:string}) {
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

	setDialog(dialog: Dialog) { this.dialog = dialog;}

	override onDestroy() {
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
	tagList: ReviewableModifierList;
	moveId:string;
	dialog: RollDialog | null;
	actor: CityActor;

	constructor( reviewableTagList: ReviewableModifierList, moveId: string, actor: CityActor) {
		super();
		this.tagList = reviewableTagList;
		if (moveId == undefined)
			throw new Error("no move Id given");
		this.moveId = moveId;
		this.dialog = null;
		this.actor =actor;
	}

	override setHandlers() {
		super.setHandlers();
		this.setReplyHandler("tagReview", this.onReply.bind(this));
		this.addNotifyHandler("updateTagList", this.onUpdateTagList.bind(this));
	}

	setDialog(dialog: RollDialog) {
		this.dialog  = dialog;
	}

	override async start() {
		const gms = game.users.filter( x=> x.isGM && x.active);
		this.registerSubscribers(gms);
		// console.log(`GMs detected :${gms.length}`);
		if (gms.length == 0)
			return this.tagList;
		let state = "pending";

		while (state != "approved") {
			try {
				const sendObj = this.sendObject;
				const results = await this.request("tagReview", sendObj);
				const result = results[0]?.value as {state: string, tagList: SendableItem[]};
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

	async updateList(reviewableList: ReviewableModifierList) {
		const obj  = {
			tagList: reviewableList.toSendableForm()
			};
		await this.notify("updateTagList", obj);

	}

	async onUpdateTagList(sendObj: {tagList: SendableItem[]}) {
		const {tagList} = sendObj;
		const reviewableList = ReviewableModifierList.fromSendableForm(tagList);
		if (this.dialog)
			this.dialog.setReviewList(reviewableList);
	}


	// /**refreshs the list with a new list on the other end useful when something new gets added*/
	// async updateTagList( list: ReviewableModifierList) {
	// 	try {
	// 		this.tagList = list;
	// 		await this.notify("updateTagList", {
	// 			tagList: this.simplifiedTagList,
	// 		});
	// 		return true;
	// 	} catch (e) {
	// 		console.log(`Add Item failed on ${tagOrStatus?.name}`);
	// 		console.error(e);
	// 	}
	// 	return false;
	// }

	onReply( _dataObj: unknown, _meta: unknown) {
		// console.log(`reply Recieved : ${dataObj?.state} `)
	}
}

export class TagReviewSlaveSession extends SlaveSession {
	dialog: TagReviewDialog | null;

	override setHandlers() {
		super.setHandlers();
		this.addNotifyHandler("updateTagList", this.onUpdateTagList.bind(this));
	}

	override setRequestHandlers() {
		this.setRequestHandler("tagReview", this.onReviewRequest.bind(this));
	}

	setDialog(dialog: TagReviewDialog) {
		this.dialog  = dialog;
	}

	async updateList(reviewableList: ReviewableModifierList) {
		const obj  = {
			tagList: reviewableList.toSendableForm()
			};
		await this.notify("updateTagList", obj);

	}

	async onUpdateTagList(sendObj: {tagList: SendableItem[]}) {
		const {tagList} = sendObj;
		const reviewableList = ReviewableModifierList.fromSendableForm(tagList);
		if (this.dialog)
			this.dialog.setReviewList(reviewableList);
	}

	async onReviewRequest( dataObj:  {actorId: string, tokenId:string, moveId: string, tagList: SendableItem[]}) {
		const {actorId, tokenId} = dataObj;
		const tagList = ReviewableModifierList.fromSendableForm(dataObj.tagList);
		const moveId = dataObj.moveId;
		const actor = CityHelpers.getOwner(actorId, tokenId) as CityActor;
		const {tagList: reviewList, state} = await CityDialogs.tagReview(tagList, moveId, this, actor);
		const sendableTagList = reviewList.toSendableForm();
		return {
			tagList: sendableTagList,
			state
		};
	}

	async requestClarification	(itemId: string, ownerId: string) {
		const dataObj  = {
			itemId,
			ownerId,
			changeType: "request-clarification"
		};
		await this.notify("tagUpdate", dataObj);
	}

	async approveTag	(itemId: string, ownerId: string) {
		const dataObj  = {
			itemId,
			ownerId,
			changeType: "approved"
		};
		await this.notify("tagUpdate", dataObj);
	}

	async rejectTag	(itemId: string, ownerId: string) {
		const dataObj  = {
			itemId,
			ownerId,
			changeType: "rejected"
		};
		await this.notify("tagUpdate", dataObj);
	}

	override onDestroy() {
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
	dataObj : {
		juiceId: string,
			ownerId: string,
			amount: number,
	};

	constructor (juiceId: string, ownerId: string, amount: number) {
		super();
		this.dataObj = { juiceId, ownerId, amount};
	}

	override setHandlers() {
		super.setHandlers();
		this.setReplyHandler("spendJuice", this.onJuiceReply.bind(this));
	}

	onJuiceReply() {}

	override async start() {
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
	override setHandlers() {
		super.setHandlers();
	}

	override setRequestHandlers() {
		this.setRequestHandler("spendJuice", this.onSpendRequest.bind(this));
	}

	async onSpendRequest(data: {juiceId: string, ownerId: string, amount: number},_meta: unknown) {
		const{juiceId, ownerId, amount} = data
		const actor = game.actors.get(ownerId) as CityActor;
		if (actor) {
			const juice =  actor.getJuice(juiceId)!;
			await juice.spend(amount);
			return {confirm:true};
		} else {
			throw new Error("Couldn't find actor");
		}
	}
}

export class TagAndStatusCleanupSessionM extends MasterSession {
	dataObj  : {
		commandString: string,
		itemId: string,
		ownerId: string,
		tokenId: string,
		burnState: boolean
	};


	constructor (commandString: string, itemId: string, ownerId: string, tokenId: string, burnState: boolean = false) {
		super();
		this.dataObj = {commandString, itemId, ownerId, tokenId, burnState};
	}

	override setHandlers() {
		super.setHandlers();
		this.setReplyHandler("cleanupTagStatus", () => {});
	}

	override async start() {
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

	override setHandlers() {
		super.setHandlers();
	}

	override setRequestHandlers(){
		this.setRequestHandler("cleanupTagStatus", this.onCleanupRequest.bind(this));
	}

	async onCleanupRequest(data: {itemId: string, ownerId: string, tokenId: string, commandString:string, burnState:number}, _meta: unknown) {
		const {itemId, ownerId, tokenId, commandString, burnState} = data;
		const actor = CityHelpers.getOwner(ownerId, tokenId) as CityActor;
		const item = actor.items.find( x => x.id == itemId) as CityItem;
		if (item) {
			switch (commandString) {
				case "burn":
					await (item as Tag).burnTag(burnState);
					break;
				case "delete":
					await (item as Tag).deleteTemporary();
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

	data: {actor: CityActor, owner?: FoundryUser, reply: null | unknown}[];
	users: FoundryUser[];

	/**
	@param {Array.<CityActor>} PCCharacterList
	*/
	constructor(PCCharacterList: CityActor[]) {
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
		this.users = [...new Set(this.data.map( x=> x.owner!))];
	}

	override setHandlers() {
		super.setHandlers();
		this.setReplyHandler("downtime", () => {});
	}

	override async start() {
		if (this.users.length == 0) return [];
		this.registerSubscribers(this.users);
		const actors = this.users
			.flatMap( user=> this.data.filter( x=> x.owner == user))
		.map(x=>x.actor.id);
		return await this.request("downtime", actors);
	}

}

export class DowntimeSessionS extends SlaveSession {
	override setHandlers() {
		super.setHandlers();
	}

	override setRequestHandlers() {
		this.setRequestHandler("downtime", this.onDowntimeRequest.bind(this));
	}

	async onDowntimeRequest(actorIdList: string[], _meta: unknown) {
		let replyObj : {actorId: string, downtimeAction: string | null}[] = actorIdList.map( id => ({
			actorId:id,
			downtimeAction: null
		}));
		const actorList = actorIdList
			.map ( id => game.actors.get(id) as CityActor)
			.filter(actor => actor.isOwner);
		for (const actor of actorList) {
			const choice = await CityDialogs.DowntimePCSelector(actor);
			if (!choice) continue;
			await CityHelpers.downtimeActionChoice(choice, actor);
			replyObj.find( x=> x.actorId == actor.id)!.downtimeAction = choice;
		}
		return replyObj;
	}

}

