import { CityHelpers } from "./city-helpers.js";
import { CityActor } from "./city-actor.js";
import { CityDB } from "./city-db.js";
import {CityLogger} from "./city-logger.js";
import {CitySettings} from "./settings.js";

export class ClueChatCards {
	static clickLock : boolean = false;

	/**  posts a clue card to the chat
	@param {Object} templateData
	@param {string} templateData.actorId id of actor spending clue
	@param {CityItem | string} templateData.metaSource the clue itself that is being spent or message Id of roll
	@param {string} templateData.method The method of the clue
	@param {string} templateData.source The source for the clue
	*/
	static async postClue (templateData: Record<string, unknown> & {actorId: string}) {
		const actor = CityDB.getActorById(templateData.actorId);
		// const	templateData= {actorId, metaSource, method};
		if (!templateData.metaSource)
			console.warn("No metasource for clue");
		if (!actor)
			throw new Error(`Couldnt find actor Id ${templateData?.actorId}`);
		const html = await renderTemplate("systems/city-of-mist/templates/parts/clue-reveal.hbs", templateData);
		await CityLogger.sendToChat2(html, {actor: actor.id});
	}

	static CLUE_LOCK = false;

	static async updateClue (html: JQuery<HTMLElement>, newdata ={}) {
		if (ClueChatCards.CLUE_LOCK) return;
		ClueChatCards.CLUE_LOCK = true;
		const messageId = html.data("messageId");
		const message = game.messages.get(messageId);
		const question = $(html).find(".clue-reveal").data("question");
		const actorId = $(html).find(".clue-reveal").data("actorId");
		const method = $(html).find(".clue-reveal").data("method");
		const source = $(html).find(".clue-reveal").data("source");
		const metaSource = $(html).find(".clue-reveal").data("metaSource");
		const partial_clue = $(html).find(".clue-reveal").data("partialClue");
		const	templateData = {question, method, source, actorId, partial_clue, metaSource, messageId, ...newdata};
		if (!metaSource)
			console.warn("No metasource for clue");
		const new_html = await renderTemplate("systems/city-of-mist/templates/parts/clue-reveal.hbs", templateData);
		const user = message?.user;
		try {
			if (!message) {
				throw new Error("No message");
			}
			await message.delete();
			const actor = CityDB.getActorById(actorId) as CityActor;
			let whisperTarget = "";
			if (CitySettings.whisperClues()) {
				whisperTarget = message.user.id;
			}
			await CityLogger.sendToChat2(new_html, {actor: actor.id, token: "", alias:actor ? actor.getDisplayedName() : "clue", altUser: user}, whisperTarget);
		} catch (err) {
			console.error(err);
		}
		ClueChatCards.CLUE_LOCK = false;
	}

	static async clueEditButtonHandlers(_app: unknown, html: JQuery<HTMLElement>, _data: unknown) {
		if ($(html).find(".clue-reveal").length == 0)
			return true;
		$(html).find(".question-part .submit-button").click (
			() => {
				this.clue_submitQuestion(html);
			});
		$(html).find(".partial-clue").change (
			() => {
				this.clue_partialClueCheckbox(html);
			});
		$(html).find(".question-part .bank-button").click (
			() => {
				this.clue_bankClue(html);
			});
		$(html).find(".answer-part .submit-button").click (
			() => {
				this.clue_submitAnswer(html);
			});
		$(html).find(".answer-part .edit-button").click (
			() => {
				this.clue_editAnswer(html);
			});
		$(html).find(".answer-part .refund-button").click (
			() => {
				this.clue_refundClue(html);
			});
		$(html).find(".answer-part .add-to-journal-button").click (
			() => {
				this.clue_addToJournal(html);
			});
		if (game.user.isGM) {
			$(html).find(".player-only").hide();
		} else {
			$(html).find(".gm-only").hide();
			const actorId = $(html).find(".clue-reveal").data("actorId");
			const actor = game.actors.find( x=> x.id == actorId);
			if ( actor && !actor.isOwner) {
				$(html).find(".player-only").hide();
				$(html).find(".3rd-party").show();
			}
		}
		return true;
	}

	static async clue_bankClue(html: JQuery<HTMLElement>) {
		const messageId = html.data("messageId");
		const actorId = $(html).find(".clue-reveal").data("actorId");
		const huge_method = $(html).find(".clue-reveal").data("method") as String;
		const source = $(html).find(".clue-reveal").data("source");
		const partial_clue = $(html).find(".clue-reveal").data("partialClue");
		const metaSource = $(html).find(".clue-reveal").data("metaSource");
		const actor = CityDB.findById(actorId, "Actor") as CityActor;
		if (!actor ) throw new Error(`Couldn't find Actor ${actorId}`);
		const [name, method]   = huge_method.split(":").map (x=> x.trim());
		const clueData = {partial: partial_clue, name, method, source};
		const message = game.messages.get(messageId);
		if (!message) {
			throw new Error("Can't find message");
		}
		const new_html = await renderTemplate("systems/city-of-mist/templates/parts/clue-reveal.hbs", {banked:true});
		const msg = await  message.update( {content: new_html});
		await ui.chat.updateMessage( msg, false);
		await actor.createClue(metaSource, clueData);
	}

	static async clue_submitAnswer(html: JQuery<HTMLElement>) {
		const answer = $(html).find(".answer-part .answer-input").val();
		await this.updateClue( html, {answer});
	}

	static async clue_editAnswer(html: JQuery<HTMLElement>) {
		const question = $(html).find(".clue-reveal").data("question");
		const answer = $(html).find(".clue-reveal").data("answer");
		await this.updateClue( html, {question, partial_answer_text: answer});
	}

	static async clue_addToJournal(html: JQuery<HTMLElement> ) {
		const question = $(html).find(".clue-reveal").data("question");
		const answer = $(html).find(".clue-reveal").data("answer");
		const actorId = $(html).find(".clue-reveal").data("actorId");
		const actor = CityDB.findById(actorId, "Actor") as CityActor;
		if (await actor.addClueJournal(question, answer))
			await CityHelpers.playWriteJournal();
	}

	static async clue_partialClueCheckbox(html: JQuery<HTMLElement>) {
		if (!game.user.isGM) return;
		const partial_clue = $(html).find(".partial-clue").is(":checked");
		const answer = $(html).find(".clue-reveal").data("answer");
		const partial_answer_text = $(html).find(".answer-part .answer-input").val();
		if (this.clickLock) return; //this handler seems to fire multiple times for some reason
		this.clickLock = true;
		if (answer) {
			await this.updateClue(html, {answer, partial_clue});
		} else {
			await this.updateClue(html, {partial_answer_text, partial_clue});
		}
		this.clickLock = false;
	}

	static async clue_refundClue(html: JQuery<HTMLElement>) {
		const question_rejected= true;
		const question = "";
		await this.updateClue( html, {question, question_rejected} );
	}

	static async clue_submitQuestion(html: JQuery<HTMLElement>) {
		const question = $(html).find(".question-part .question-input").val();
		await this.updateClue( html, {question});
	}


}
