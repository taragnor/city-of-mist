import { SystemModule } from "./config/system-module.js";
import { Essence } from "./city-item.js";
import { StatusCreationOptions } from "./config/statusDropTypes.js";
import { TagCreationOptions } from "./config/statusDropTypes.js";
import { CitySettings } from "./settings.js"
import { ThemeType } from "./datamodel/theme-types.js";
import { HTMLTools } from "./tools/HTMLTools.js";
import { Themebook } from "./city-item.js";
import { ThemeKit } from "./city-item.js";
import { Move } from "./city-item.js";
import { Tag } from "./city-item.js";
import { localize } from "./city.js";
import { CityItem } from "./city-item.js";
import { CityDB } from "./city-db.js";
import { SelectedTagsAndStatus } from "./selected-tags.js";
import { CityHelpers } from "./city-helpers.js";
import { SceneTags } from "./scene-tags.js";
import { CityDialogs } from "./city-dialogs.js";
import { CityLogger } from "./city-logger.js";
import { ACTORMODELS } from "./datamodel/actor-types.js";
import { Juice } from "./city-item.js";
import { Improvement } from "./city-item.js";
import { Status } from "./city-item.js";
import { Clue } from "./city-item.js";
import { GMMove } from "./city-item.js";
import { ClueJournal } from "./city-item.js";
import { Theme } from "./city-item.js";
import { Spectrum } from "./city-item.js";
import { CityActorSheet } from "./city-actor-sheet.js";

export class CityActor extends Actor<typeof ACTORMODELS, CityItem, ActiveEffect<CityActor, CityItem>> {

	declare sheet: CityActorSheet;

	get mainThemes() : Theme[] {
		return this.getThemes().sort ( (a,b) => b.themeSortValue() - a.themeSortValue());
	}

	get loadout() : Theme | undefined {
		return this.items.find(  (item: CityItem) => {
			return item.isTheme() && item.isLoadoutTheme();
		}) as Theme | undefined;
	}

	possibleExtraThemeSources() : CityActor[] {
		const nonGMOwners = game.users.filter( x=> !x.isGM && this.testUserPermission(x, "OWNER"))
		return (game.actors.contents as CityActor[]).filter( actor => nonGMOwners.some( user => actor.testUserPermission(user, "OWNER") && actor.system.type != "crew"));
	}

	get crewTheme(): Theme | undefined {
		return this.activeCrew;
	}

	get crewThemes(): Theme[] {
		const nonGMOwners = game.users
			.filter( x=> !x.isGM && this.testUserPermission(x, "OWNER"));
		const validCrewActors = (game.actors.contents as CityActor[])
			.filter( actor => nonGMOwners.some( user => actor.testUserPermission(user, "OWNER")
				&& actor.system.type == "crew"));
		return validCrewActors.flatMap( x=> x.getThemes());
	}

	get activeCrew(): Theme | undefined {
		if (this.system.type != "character") return undefined;
		const crewThemes = this.crewThemes;
		const activeId = this.system.activeCrewId;
		const theme = crewThemes.find( x=> x.id == activeId);
		if (theme) return theme;
		if (crewThemes.length == 0) return undefined;
		return crewThemes[0];
	}

	get allLinkedExtraThemes() : Theme[] {
		const sources = this.possibleExtraThemeSources();
		return sources.flatMap( actor => actor.personalExtraThemes());
	}

	personalExtraThemes() : Theme[] {
		const themeType = this.system.type;
		switch (themeType) {
			case "character":
			return this.items.filter( x=> x.isTheme() && x.isExtraTheme()) as Theme[];
			case "crew":
				return [];
			case "threat":
		return this.items.filter( x=> x.isTheme()) as Theme[];
			default:
				themeType satisfies never;
				console.error(`Unknown themetype ${themeType}`);
				return [];
		}
	}

	isDanger() : this is Danger {
		return this.system.type == "threat";
	}

	/** gets top level gmmoves (not submoves) */
	get gmmoves() {
		return this.getGMMoves()
			.filter( x=> !x.system.superMoveId);
	}

	get clues() : Clue[] {
		return this.items.filter(x=> x.system.type == "clue") as Clue[];
	}

	get clueJournal(): ClueJournal[] {
		return this.items.filter(x => x.system.type == "journal") as ClueJournal[];
	}

	get templates() {
		return this.getAttachedTemplates();
	}

	get my_statuses() {
		return this.getStatuses();
	}

	get collectiveStatus(): Status[] {
		return	this.getStatuses().filter(x=>x.system.specialType == "collective");
	}

	async updateCollectiveStatus(this: Danger): Promise<void> {
		let collective = this.collectiveStatus;
		let useCollective = CitySettings.get("collectiveMechanics");
		if (this.collective_size == 0 || useCollective == "city-of-mist") {
			collective.forEach( status=> status.delete());
			return;
		} else {
			if (collective.length == 0) {
				const col_name = SystemModule.active.collectiveTermName();
				await this.createNewStatus(col_name, this.collective_size, this.collective_size, { "specialType": "collective"});
				return;
			}
			if (this.collective_size != collective[0].system.tier) {
				await collective[0].update( {"system.tier": this.collective_size, "system.pips": 0});
			}
		}
	}

	async getCollectiveStatus() : Promise<Status> {
		let collective = this.collectiveStatus;
		if (!collective.length) {
			// const system = CitySettings.getBaseSystem();
			// const col_name = localize(COLLECTIVE[system]);
				const col_name = SystemModule.active.collectiveTermName();
			await this.createNewStatus(col_name, this.collective_size, 0, { "specialType": "collective"});
			collective = this.collectiveStatus;
		}
		return collective[0];
	}

	get my_story_tags(): Tag[] {
		return this.getStoryTags();
	}

	get my_spectrums() {
		return this.items.filter( x=> x.type == "spectrum");
	}

	get collective_size() {
		if (this.system.type == "threat") {
			const size = Number(this.system.collectiveSize ?? 0);
			if (Number.isNaN(size)) return 0;
			return size;
		}
		return 0;
	}

	get spectrums() {
		return this.getSpectrums();
	}


	is_character(): this is PC {
		return this.type == "character";
	}

	is_scene_container() {
		return this.name.includes(SceneTags.SCENE_CONTAINER_ACTOR_NAME);
	}

	is_danger_or_extra() {
		return this.type ==  "threat";
	}

	is_crew_theme() {
		return this.type ==  "crew";
	}

	get helpPoints(): Juice[]  {
		return this.items.
			filter( x=>x.isJuice() &&  x.isHelp()) as Juice[];
	}

	get hurtPoints (): Juice[] {
		return this.items.
			filter( x=>x.isJuice() &&  x.isHurt()) as Juice[];
	}

	get juice() {
		return this.items.
			filter( x=> x.isJuice());
	}

	get tokenId() {
		return this?.token?.id ?? "";
	}

	get sceneId() {
		return this?.token?.parent?.id ?? "";
	}

	get storyTagsAndStatuses() : (Tag  | Status) [] {
		return (this.my_statuses as (Tag | Status)[])
			.concat(this.my_story_tags);
	}

	hasHelpFor(actorId: string) :boolean {
		return this.helpPoints.some( x=> x.system.targetCharacterId == actorId && x.system.amount > 0);

	}

	hasHurtFor(actorId: string) {
		return this.hurtPoints.some( x=> x.system.targetCharacterId == actorId && x.system.amount > 0);

	}

	override get visible() {
		if (this.type == "threat" && this.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME)
			return false;
		else
			return super.visible;
	}

	/** Gets amount of juice for a given provided actor id.
	whichOne can be either "help" | "hurt"
	returns Number
	 */
	getHelpHurtFor( whichOne: "help" | "hurt" = "help", targetCharacterId: string) {
		let arr ;
		switch (whichOne) {
			case "help": arr = this.helpPoints; break;
			case "hurt" : arr = this.hurtPoints; break;
			default:
				throw new Error(`Bad request: ${whichOne}, must use either "help" or "hurt"`);
		}
		return arr
			.filter( juice => juice.targets(targetCharacterId))
			.reduce( (acc,juice) => juice.system.amount + acc, 0);
	}

	getGMMoves(depth = 0) : GMMove[] {
		if (depth > 2) return [];
		if (this.type != "threat")
			return [];
		const GMMoves : GMMove[] = this.items.filter( x => x.system.type == "gmmove") as GMMove[];
		const attached = this.getAttachedTemplates().map( x=> x?.getGMMoves(depth+1)  ?? []).flat();
		return GMMoves.concat(attached);
	}

	getSpectrums(depth = 0) : Spectrum[] {
		if (depth > 2) return [];
		if (this.type != "threat")
			return [];
		const mySpectrums : Spectrum[] = this.items.filter( x=> x.system.type == "spectrum") as Spectrum[];
		const templateSpectrums = this.getAttachedTemplates()
			.map( x=> x?.getSpectrums(depth+1) ?? [])
			.flat();
		for (const spec of templateSpectrums) {
			if (!mySpectrums.find( x=> x.name == spec.name))
				mySpectrums.push(spec);
		}
		return mySpectrums;

		//OLD CODE
		// return this.items.filter( x => x.type == "spectrum")
		// 	.concat(
		// 		this.getAttachedTemplates()
		// 		.map( x=> x?.getSpectrums(depth+1)) ?? []
		// 	).flat()
		// 	.reduce( (a,spec) => {
		// 		if (!a.some( a=> a.name == spec.name))
		// 			a.push(spec);
		// 		return a;
		// 	}, []);
	}

	ownsMove(move_id: string) {
		return this.getGMMoves().find(x => x.id == move_id)?.parent == this;
	}

	getAttachedTemplates() : Danger[] {
		if (this.system.type != "threat") return [];
		return (this.system.template_ids ?? [])
			.map( id =>  CityHelpers.getDangerTemplate(id)
				?? CityDB.getActorById(id) as Danger)
			.filter (x => x != null);
	}

	versionIsLessThan(version: string) {
		return String(this.system.version) < String(version);
	}

	async updateVersion(version: string) {
		version = String(version);
		if (this.versionIsLessThan(version)) {
			console.debug (`Updated version of ${this.name} to ${version}`);
			for (const item of this.items) {
				console.debug(`Updating Version of Item: ${item.name}`);
				await item.updateVersion(version);
			}
			return await this.update( {"system.version" : version});
		}
		if (version < this.system.version)
			console.warn (`Failed attempt to downgrade version of ${this.name} to ${version}`);

	}

	/** returns the theme for a given id
	@return {CityItem}
	 */
	getTheme(id: string): Theme | undefined {
		return this.items.find(x => x.type == "theme" && x.id == id) as Theme;
	}

	/** returns the tag for a given id
	@return {CityItem}
	 */
	getTag(id: string): Tag  | undefined {
		return this.items.find(x => x.type == "tag" && x.id == id) as Tag | undefined;
	}

	/** returns the item for a given id
	@return {CityItem}
	 */
	getItem(id: string): CityItem  | undefined{
		return this.items.find(x =>  x.id == id);
	}

	/** returns the tag for a given id
	@return {CityItem[]}
	 */
	getStoryTags(): Tag[] {
		return this.items.filter( x => {
			return x.system.type == "tag" && x.system.subtype == "story";
		})
			.sort(CityDB.namesort<CityItem>) as Tag[];
	}

	getSelectable(id: string) :Tag | Status | undefined{
		return this.items.find(x => (x.type == "tag" || x.type == "status") && x.id == id) as Tag | Status | undefined;
	}

	getStatus(id: string): Status | undefined {
		return this.items.find(x => x.type == "status" && x.id == id) as Status;
	}

	getStatuses() : Status[] {
		return this.items
			.filter(x => x.type == "status")
			.sort(CityDB.namesort) as Status[];
	}

	getClue(id: string): Clue | undefined {
		return this.items.find(x => x.type == "clue" && x.id == id) as Clue | undefined;
	}

	getJournalClue(id: string) : ClueJournal | undefined{
		return this.items.find(x => x.type == "journal" && x.id == id) as ClueJournal | undefined;
	}

	getJuice(id: string) : Juice | undefined {
		return this.items.find(x => x.type == "juice" && x.id == id) as Juice | undefined;
	}

	getGMMove(id: string): GMMove | undefined {
		return this.getGMMoves().find(x => x.type == "gmmove" && x.id == id) as GMMove | undefined;
	}

	getImprovement(id: string) : Improvement | undefined {
		return this.items.find(x => x.type == "improvement" && x.id == id) as Improvement | undefined;
	}

	async getSpectrum(id: string) {
		return this.items.find(x => x.type == "spectrum" && x.id == id);
	}

	hasStatus(name: string): Status | undefined {
		return this.items.find( x => x.type == "status" && x.name == name)as Status | undefined;
	}

	isNewCharacter() : boolean {
		return !this.system.finalized;
	}

	getTags(themeId : string | null = null, subtype :null | Tag["system"]["subtype"]  = null) : Tag[] {
		const tags=  this.items.filter(x => {
			return x.system.type == "tag" && (themeId == null || x.system.theme_id == themeId) && (subtype == null || x.system.subtype == subtype);
		});
		if (! tags.filter)
			throw new Error("non array returned");
		return tags as Tag[];
	}

	/** Deletes a tag from the actor
@param {string} tagId
@param {{removeImprovement ?: boolean}} options
@param {boolean} options.removeImprovement removes an improvement from the actor as tag is deleted
	 */
	async deleteTag(tagId :string, options: {removeImprovement?: boolean;} = {}) {
		const tag  =  this.getTag(tagId);
		if (!tag) return;
		let afterMsg = "";
		if (tag.theme != null && !tag.isBonusTag()) {
			const theme = tag.theme;
			if (tag.isPowerTag()) {
				await theme.incUnspentUpgrades();
				afterMsg = localize("CityOfMist.log.theme.addImp");
			}
			if (tag.isWeaknessTag() && options?.removeImprovement) {
				await theme.decUnspentUpgrades();
				afterMsg = localize("CityOfMist.log.theme.remImp");
			}
		}
		await CityLogger.modificationLog(this, `Deleted` , tag, afterMsg);
		return await this.deleteEmbeddedById(tagId);
	}

	async deleteEmbeddedById(id: string) {
		return await this.deleteEmbeddedDocuments("Item", [id]);
	}

	async deleteStatus(id: string) {
		return await this.deleteEmbeddedById(id);
	}

	/**deletes a status by name
	@param {string} name
	 */
	async deleteStatusByName(name: string) {
		const status = this.getStatuses().find (x=> x.name == name);
		if (status)
			await this.deleteStatus(status.id);
	}

	async deleteGMMove(id: string) {
		const move = this.getGMMove(id);
		if (!move) throw new Error(`Can't delte bad id ${id}`);
		move.submoves.forEach( x=> this.deleteGMMove(x.id));
		return await this.deleteEmbeddedById(id);

	}

	async deleteClue(id: string) {
		return await this.deleteEmbeddedById(id);
	}

	async deleteJuice(id: string) {
		return await this.deleteEmbeddedById(id);
	}

	async deleteSpectrum(id: string) {
		return await this.deleteEmbeddedById(id);
	}

	async spendJuice (id: string, amount =1) {
		const juice = this.items.find( x=> x.system.type =="juice"  &&x.id == id) as Juice | undefined;
		if (!juice) throw new Error(`Can't find juice ${id}`);
		await juice.spend(amount);
		if (juice.getAmount() <= 0)
			await this.deleteJuice(id);
	}

	async deleteImprovement(impId: string) {
		const imp  = this.getImprovement(impId);
		if (!imp)
			throw new Error(`Improvement ${impId} not found`);
		if (imp.system.theme_id && imp.system.theme_id.length > 0) {
			const theme =  this.getTheme(imp.system.theme_id);
			if (!theme) {
				throw new Error(`Can't find theme ${imp.system.theme_id}`);
			}
			await theme.incUnspentUpgrades();
		} else {
			if (this.system.type == "character") {
				await this.update({"system.unspentBU": this.system.unspentBU+1});
			} else {
				throw new Error("Something strange happened");
			}
		}
		return this.deleteEmbeddedDocuments("Item", [impId]);
	}

	async setTokenName(name: string) {
		await this.update({token: {name}});
	}

	async deleteTheme(themeId: string, awardBU = true) {
		const theme = this.getTheme(themeId);
		if (!theme) throw new Error(`Can't find theme ${themeId}`);
		if (awardBU && this.system.type == "character") {
			const BUV = theme.getBuildUpValue();
			await (this as PC).incBuildUp(BUV);
			await theme.destroyThemeMessage();
		} else {
			await CityHelpers.modificationLog(this, `Theme Deleted`, theme);
		}
		const tb = theme.themebook;
		if (tb && tb.isLocal) {
			if (tb.isThemeBook()) {
				console.log("Deleting embedded themebook");
				await this.deleteEmbeddedById(tb.id);
			} else if (tb.isThemeKit()) {
				const tb2 = tb.themebook;
				if (tb2 && tb2.isLocal) {
					console.log("Deleting embedded themebook");
					await this.deleteEmbeddedById(tb2.id);
				}
				console.log("Deleting embedded themekit");
				await this.deleteThemeKit(tb.id);
			}
		}
		await this.deleteEmbeddedById(themeId);
		console.log("Deleting theme");
	}

	async deleteThemeKit(themeKitId: string) {
		if (!themeKitId) return;
		console.log("Deleting Theme Kit");
		await this.deleteEmbeddedById(themeKitId);
	}

	getImprovements(themeId : string | null = null) : Improvement[] {
		return this.items.filter(x => x.system.type == "improvement" && (themeId == null || x.system.theme_id == themeId)) as Improvement[];
	}

	/** get improvements from self and from other activeExtra and crew theme
	 */
	getAllImprovements(): Improvement[] {
		if (!this.is_character())
			return this.getImprovements();
		const base = this.getImprovements();
		const crewImprovements = this.getCrewThemes()
			.flatMap( x=> x.getImprovements());
		const activeExtraImprovements =
			this.activeExtra ? this.activeExtra.getImprovements(): [];
		return base
			.concat(crewImprovements)
			.concat(activeExtraImprovements);
	}

	get activeExtra(): Theme | undefined {
		if (this.system.type != "character") return undefined;
		const id = this.system.activeExtraId ;
		const list = this.allLinkedExtraThemes;
		if (id) {
			const theme = list.find( theme => theme.id == id);
			if (theme) return theme;
		}
		if( list.length > 0) return list[0];
		return undefined;
	}

	getCrewThemes(): Theme[] {
		return (game.actors.contents as CityActor[])
			.filter( actor => actor.system.type=="crew" && actor.isOwner)
			.flatMap( actor=> actor.getThemes())
	}

	async createNewTheme(name: string, themebook: Themebook | ThemeKit, isExtra: boolean = false ) {
		const nascent = !this.isNewCharacter();
		const unspent_upgrades = nascent ? 1 : 3;
		const themebook_name = themebook.name;
		const system : Partial<Theme["system"]>= {
			themebook_id: themebook.id, themebook_name, unspent_upgrades, nascent, isExtra
		};
		const obj = {
			name, type: "theme", system	};
		if (this.mainThemes.length > 3 && !isExtra) {
			ui.notifications.warn("Can't add another theme");
			return null;
		}
		const theme  = await this.createNewItem(obj) as Theme;
		if (theme) {
			Hooks.callAll("themeCreated", this, theme);
			return theme;
		}
		ui.notifications.error(`Trouble creating theme: ${name} from ${themebook.name}`);
	}

	async addThemeKit(tk: ThemeKit, isExtra: boolean = false) {
		if (this.mainThemes.length>3 && !isExtra) {
			ui.notifications.warn("Can't add extra theme kit, already at 4 themes");
			return;
		}
		const localtk =  await this.createNewItem(tk) as ThemeKit;
		if (!localtk.id) {
			throw new Error("Doesn't have an ID");
		}
		await this.createNewTheme(tk.displayedName, localtk, isExtra);
	}


	async createNewThemeKit( name = "Unnamed Theme Kit") {
		const obj = {
			name,
			type: "themekit",
			is_theme_kit: true,
		};
		return await this.createNewItem(obj);
	}

	getActivatedImprovementEffects(move_id: string) {
		return this.getAllImprovements()
			.filter( x=> x.isImprovementActivated(move_id))
			.map (x => x.getActivatedEffect());
	}

	async createNewItem(obj: Record<string, any>) {
		return (await this.createEmbeddedDocuments("Item", [obj]))[0];
	}

	async createNewStatus (name: string, tier=1, pips=0, options: DeepPartial<Status["system"]>={} ): Promise<Status> {
		const obj : DeepPartial<Status> = {
			name,
			type: "status",
			system : {...options, pips, tier}};
		return await this.createNewItem(obj) as Status;
	}

	async createClue(metaSource= "", clueData: Partial<Clue["system"]> = {}) {
		const existing =  this.items.find( x=> x.system.type == "clue" && x.system.metaSource == metaSource) as Clue | undefined;
		if (metaSource && existing) {
			existing.update({"system.amount": existing.system.amount+1});
			return true;
		}
		const obj = await this.createNewClue({metaSource, ...clueData});
		const clue =  this.getClue(obj.id)!;
		const updateObj = await CityHelpers.itemDialog(clue);
		if (updateObj) {
			const partialstr = clue.system.partial ? ", partial": "";
			CityHelpers.modificationLog(this, "Created", clue, `${clue.system.amount}${partialstr}` );
			return true;
		} else  {
			await this.deleteClue(obj.id);
			return false;
		}
	}

	async createNewClue (dataobj: Partial<Clue["system"]> & {name?: string} ) : Promise<Clue>{
		const name = dataobj.name ?? "Unnamed Clue";
		const obj = {
			name, type: "clue", system : {amount:1, ...dataobj}};
		return await this.createNewItem(obj) as Clue;
	}

	async createNewJuice (name: string, subtype = "") {
		const obj = {
			name, type: "juice", system : {amount:1, subtype}};
		return await this.createNewItem(obj);
	}

	async createNewGMMove (name : string, systemData : Partial<GMMove["system"]> = {}) : Promise<GMMove> {
		const obj = {
			name, type: "gmmove", system : {subtype: "soft", ...systemData}};
		return await this.createNewItem(obj) as GMMove;
	}

	async createNewSpectrum (name: string) {
		const obj = {
			name, type: "spectrum" };
		return await this.createNewItem(obj);
	}

	async addClueJournal(question: string, answer: string) {
		const obj = {
			name: "Unnamed Journal",
			type: "journal",
			system: {question, answer}
		}
		if (!this.clueJournal.find( x=> x.system.question == question && x.system.answer == answer))
			return await this.createNewItem(obj);
		else return null;
	}

	getThemeKit(id: string) {
		return this.items.find( x=> x.id == id && x.type =="themekit");
	}


	localExtraThemes() : Theme[] {
		return this.items.filter( x=> x.isTheme()
			&& x.isExtraTheme()
		) as Theme[];
	}

	getThemes() : Theme[]{
		return this.items.filter( x=> x.isTheme()
			&& !x.isExtraTheme()
			&& x != this.loadout) as Theme[];
	}

	// get activeExtraTheme(): Theme | undefined {
	// 	if (this.system.type != "character") return undefined;
	// 	const extraId = this.system.activeExtraId;
	// 	let theme= this.localExtraThemes().find( x=> x.id == extraId);
	// 	if (theme) return theme;
	// 	const filterList = game.actors.filter( (actor: CityActor) =>
	// 		actor.isExtra() && actor.isOwner
	// 		&& extraId == actor.id
	// 	);
	// 	if (filterList.length == 0)
	// 		return undefined;
	// 	const activeExtra = filterList[0];
	// 	if (activeExtra  == null) return undefined;
	// 	const activeTheme = activeExtra.items.find( x=> x.type  == "theme");
	// 	return activeTheme;

	// }

	getNumberOfThemes(target_type: ThemeType) {
		// const themes = this.items.filter(x => x.type == "theme") as Theme[];
		const themes = this.getThemes();
		let count = 0;
		for (const theme of themes) {
			const theme_type = theme.getThemeType();
			if (target_type == theme_type)
				count++;
		}
		return count;
	}

	async incBuildUp(this: PC, amount = 1) {
		const oldBU = this.system.buildup.slice();
		const [newBU, improvements] = CityHelpers.modArray(oldBU, amount, 5);
		await this.update({"system.buildup" : newBU});
		if (improvements > 0)  {
			await this.update({"system.unspentBU": this.system.unspentBU+improvements});
		}
		return improvements;
	}

	async decBuildUp(this: PC, amount =1) {
		const oldBU = this.system.buildup.slice();
		const [newBU, improvements] = CityHelpers.modArray(oldBU, -amount, 5);
		await this.update({"system.buildup" : newBU});
		if (improvements < 0)  {
			await this.update({"system.unspentBU": this.system.unspentBU+improvements});
		}
		return improvements;
	}

	getBuildUp(this:PC) : number {
		return this.system.buildup.reduce( (acc, i) => acc+i, 0);
	}

	/** adds a tag to a chosen theme on the actor
	args
	@param {string} theme_id - id of theme,
	@param temp_subtype {"power" | "weakness" | "bonus"},
	@param question_letter{string} letter of the answered question or "_" for bonus,
	@param {{crispy ?: boolean, awardImprovement ?: boolean, noEdit ?: boolean}} options
	 */
	async addTag(theme_id: string, temp_subtype: "power" | "weakness" | "bonus",  question_letter: string | null, options: {crispy?: boolean; awardImprovement?: boolean; noEdit?: boolean;} = {}) {
		const theme = this.getTheme(theme_id);
		if (!theme) {
			throw new Error(`Couldn't get Theme for id ${theme_id} on ${this.name}`);
		}
		const themebook = theme.themebook;
		if (options?.crispy == undefined)
			if (this.type != "character" && temp_subtype != "weakness") {
				options.crispy = true;
			} else {
				options.crispy = false;
			}
		let tag: Tag, upgrades;
		if (!themebook) {
			throw new Error("Couldn't find Themebook!");
		}
		switch (themebook.system.type) {
			case "themebook":
				[tag, upgrades]= await this._addTagFromThemeBook(theme, temp_subtype, question_letter, options);
				break;
			case "themekit":
				[tag, upgrades]= await this._addTagFromThemekit(theme, temp_subtype, question_letter, options);
				break;
			default: throw new Error(`Bad Type : $${themebook.type}`);
		}
		if (!options?.noEdit && !tag.isPartOfThemeKit()) {
			await CityDialogs.itemEditDialog(tag);
		}
		let afterMsg = "";
		if (upgrades > 0)
			afterMsg = localize("CityOfMist.log.theme.addImp" );
		else if (upgrades < 0)
			afterMsg = localize("CityOfMist.log.theme.remImp" );
		await CityLogger.modificationLog(this, "Created",  tag, afterMsg);

	}

	async _addTagFromThemeBook(theme: Theme, temp_subtype:"power" | "weakness" | "bonus", question_letter: string | null, options : {awardImprovement?: boolean, crispy?: boolean}) : Promise<[Tag,number]> {
		const themebook = theme.themebook!;
		if (themebook.system.type == "themekit") {throw new Error("Themekit detected?");
		}
		let custom_tag = false;
		let question, subtag, subtype;
		let upgrades = 0;
		switch (temp_subtype) {
			case "power":{
				subtype = "power";
				const tagdata = (themebook as Themebook)
				.themebook_getTagQuestions(temp_subtype)
				.find( x=> x.letter == question_letter)!;
				question = tagdata.question;
				subtag = tagdata.subtag;
				await theme.decUnspentUpgrades();
				upgrades--;
				break;
			}
			case "weakness":{
				const tagdata = (themebook as Themebook)
				.themebook_getTagQuestions(temp_subtype)
				.find( x=> x.letter == question_letter)!;
				subtype = "weakness";
				question = tagdata.question;
				subtag = tagdata.subtag;
				if (options.awardImprovement){
					await theme.incUnspentUpgrades();
					upgrades++;
				}
				break;
			}
			case "bonus" :
				subtype = "power";
				custom_tag = true;
				subtag = false;
				question_letter = "_";
				question = "???";
				break;
			default:
				throw new Error(`Unrecognized Tag Type ${temp_subtype}`);
		}
		const obj = {
			name: "Unnamed Tag",
			type: "tag",
			system: {
				subtype,
				theme_id: theme.id,
				question_letter,
				question,
				crispy: options?.crispy ?? false,
				custom_tag,
				subtagRequired : subtag,
			}
		};
		return [await this.createNewItem(obj) as Tag, upgrades];
	}

	async _addTagFromThemekit(theme: Theme, temp_subtype:"power" | "weakness" | "bonus", question_letter: string | null, options: {awardImprovement ?: boolean, crispy?:boolean},): Promise<[Tag, number]> {
		const themebook = theme.themebook!;
		if (themebook.system.type != "themekit") {
			throw new Error("Not a themekit!");
		}
		const tagdata = (themebook as ThemeKit)
		.themekit_getTags(temp_subtype)
		.find( x=> x.letter == question_letter);
		if (!tagdata && temp_subtype != "bonus") {
			throw new Error(`Can't find TagData for ${theme.name} ${temp_subtype}, ${question_letter}`);
		}
		let custom_tag = false;
		let subtag = false;
		let question = "-";
		let tagname, subtype;
		let upgrades = 0;
		const description = tagdata?.description ?? "";
		switch(temp_subtype) {
			case "power":
				subtype = "power";
				tagname = tagdata!.tagname ?? (tagdata as Record<string, string>).name ;
				subtag = false;
				await theme.decUnspentUpgrades();
				upgrades --;
				break;
			case "weakness":
				subtype = "weakness";
				tagname = tagdata!.tagname ?? (tagdata as Record<string, string>).name ;
				subtag = false;
				if (options.awardImprovement) {
					await theme.incUnspentUpgrades();
					upgrades ++;
				}
				break;
			case "bonus":
				subtype = "power";
				custom_tag = true;
				question_letter = "_";
				question = "???";
				break;
			default:
				throw new Error(`Unknown tag subtype ${temp_subtype}`);
		}
		const obj = {
			name: tagname ?? "Unnamed Tag",
			type: "tag",
			system: {
				subtype,
				theme_id: theme.id,
				question_letter,
				question,
				crispy: options?.crispy ?? false,
				custom_tag,
				subtagRequired : subtag,
				description,
			},
		};
		return [await this.createNewItem(obj) as Tag, upgrades];
	}

	async addImprovement(theme_id: string, number: number) {
		//TODO: accomodate new effect class in improvement this may not be right spot
		const theme =  this.getTheme(theme_id);
		if (!theme) throw new Error(`Can't fint theme ${theme_id}`);
		const themebook =  theme.themebook;
		if (!themebook) throw new Error(`Can't fint theme book for ${theme.name}`);
		// const data = themebook.system;
		const imp = themebook.isThemeBook()
			? themebook.themebook_getImprovements()[number]
			: themebook.themekit_getImprovements()[number];
		console.log(imp);
		if (!imp)
			throw new Error(`improvement number ${number} not found in theme ${theme_id}`);
		const obj = {
			name: imp.name,
			type: "improvement",
			system: {
				description: imp.description,
				uses: {
					max: imp?.uses ?? 0,
					current: imp?.uses ?? 0,
				},
				theme_id,
				chosen: true,
				effect_class: imp.effect_class,
			}
		};
		try {
			const docs = await this.createNewItem(obj);
			await theme.decUnspentUpgrades();
			return docs;
		}
		catch (e) {
			console.log("Problem Adding Improvement");
			Debug(this);
			throw e;
		}
	}

	async addBuildUpImprovement(this: PC, impId: string): Promise<Improvement> {
		const improvements = await CityHelpers.getBuildUpImprovements();
		const imp = improvements.find(x=> x.id == impId);
		if (imp == undefined) {
			throw new Error(`Couldn't find improvement ID:${impId}`);
		}
		const obj = {
			name: imp.name,
			type: "improvement",
			system: {
				description: imp.system.description,
				theme_id: "",
				effect_class: imp.system.effect_class,
				chosen: true,
				uses: {
					max: imp.system?.uses?.max ?? 0,
					current: imp.system?.uses?.max ?? 0
				}

			}
		};
		const unspentBU = this.system.unspentBU;
		await this.update({"system.unspentBU": unspentBU-1});
		return await this.createNewItem(obj) as Improvement;
	}


	getBuildUpImprovements(this:PC ) : Improvement[] {
		return this.items.filter(x => x.system.type == "improvement" && x.system.theme_id.length == 0) as Improvement[];
	}

	async createStoryTag(name = "Unnamed Tag", preventDuplicates = false, options : TagCreationOptions = {}) : Promise<Tag | null> {
		name = name.trim();
		if (preventDuplicates) {
			if (this.getStoryTags().some( x=> x.name == name))
				return null;
		}
		const temporary = options?.temporary ?? !(game.user.isGM);
		const obj : DeepPartial<CityItem> = {
			name,
			type: "tag",
			system: {
				subtype: "story",
				theme_id: "",
				question_letter : "_",
				question: "",
				crispy: false,
				burned: false,
				temporary,
				...options,
			}
		};
		return await this.createNewItem(obj) as Tag;
	}

	get relationshipTags(): Tag[] {
		return this.items.filter( item => item.isTag() && item.isRelationshipTag()) as Tag[];
	}

	async createRelationshipTag(name = "Unnamed Tag", options: Partial<Tag["system"]> = {}) : Promise<Tag | null> {
		const obj : DeepPartial<CityItem> = {
			name: name.trim(),
			type: "tag",
			system: {
				subtype: "relationship",
				theme_id: "",
				question_letter : "_",
				question: "",
				crispy: true,
				...options,
			}
		};
		return await this.createNewItem(obj) as Tag;
	}

	async deleteStoryTagByName(tagname: string) {
		const tag = this.getStoryTags().find( x=> x.name == tagname);
		if (tag)
			return await this.deleteTag(tag.id);
	}

	async burnTag(id: string, state = 1) {
		const tag =  this.getTag(id);
		if (!tag)
			throw new Error(`Can't find tag ${id} to burn`);
		const interval = 0.4;
		if (state > 0) {
			CityHelpers.playBurn();
			let level = 3;
			while (level  > 0 ) {
				await tag.burnTag( level-- );
				await CityHelpers.asyncwait(interval);
			}
		} else {
			await tag.burnTag(0);
		}
	}

	async unburnTag(tagId: string) {
		await this.unburnTag(tagId);
	}

	async addAttention(themeId: string, amount=1) {
		const theme =  this.getTheme(themeId);
		if (!theme) throw new Error(`Can't find theme id ${themeId}`);
		const extra_improvements = await theme.addAttention(amount);
		if (this.isNewCharacter()) {
			console.log("Character finalized");
			await this.update({"system.finalized" : true});
		}
		return extra_improvements;
	}

	async removeAttention(themeId: string, amount=1) {
		const theme = this.getTheme(themeId);
		if (!theme) throw new Error(`Can't find theme id ${themeId}`);
		const extra_improvements = await theme.removeAttention(amount);
		return extra_improvements;
	}

	async addFade(themeId: string, amount=1) {
		const theme= this.getTheme(themeId);
		if (!theme) throw new Error(`Can't find theme id ${themeId}`);
		if (theme.crack == 2) {
			if (! await HTMLTools.confirmBox(
				localize("CityOfMist.dialog.actorSheet.addFade.title"),
				localize("CityOfMist.dialog.actorSheet.addFade.body")
			)) return false;
		}
		const theme_destroyed = await theme.addFade(amount);
		if (theme_destroyed) {
			await this.deleteTheme(themeId, true);
		}
		let txt =`Crack/Fade added to ${theme.displayedName}`
		if (theme_destroyed)
			txt += " ---- Theme Destroyed!";
		else
			txt += ` (Current ${await theme.getCrack()})`;
		await CityHelpers.modificationLog(this, txt);
		return theme_destroyed;
	}

	async removeFade (themeId:string, amount=1) {
		const theme= this.getTheme(themeId);
		if (!theme) throw new Error(`Can't find theme id ${themeId}`);
		await theme.removeFade(amount);
		let txt =`${theme.parent!.name}: Crack/Fade removed from ${theme.getDisplayedName()}`;
		txt += ` (Current ${await theme.getCrack()})`;
		await CityHelpers.modificationLog(this, txt);
		return false;
	}

	async resetFade (themeId: string) {
		const theme= this.getTheme(themeId);
		if (!theme) throw new Error(`Can't find theme id ${themeId}`);
		await theme.resetFade();
	}

	isLocked() {
		return this.system.locked;
	}

	isExtra() {
		return this.type == "threat";
	}

	async toggleLockState() {
		const locked = !this.system.locked;
		SelectedTagsAndStatus.clearAllActivatedItems();
		await CityHelpers.playLockOpen();
		return await this.update( {"system.locked": locked});
	}

	async toggleAliasState(this: PC | Danger) {
		const useAlias = !this.system.useAlias;
		return await this.update( {system: {useAlias}});
	}

	async setExtraThemeId (id: string) {
		await this.update({system: {activeExtraId:id}});
	}

	async grantAttentionForWeaknessTag(id: string) {
		const tag =  this.getSelectable(id);
		if (!tag) throw new Error(`Can't find selectable ${id}`);
		if (tag.system.type != "tag") return;
		const theme =  this.getTheme(tag.system.theme_id);
		if (!theme) throw new Error(`Can't get theme for ${tag.name}`);
		await theme.addAttention();
	}

	getLinkedTokens() {
		return this.getActiveTokens().filter (x=> !x.actor.token);
	}

	get displayedName() {
		return this.getDisplayedName();
	}

	get pronouns() : string[] {
		if (this.system.type == "crew") return [];
		const prString = this.system.pronouns;
		if (!prString) return [];
		const prArray = prString
			.split("/")
			.map ( str => {
				if (!str) return "";
				return str.trim().toLowerCase();
			});
		return CityActor._derivePronouns(prArray);
	}

	/** takes an array of pronounds and substitutes if it is incomplete
	 */
	static _derivePronouns(prArray: string[]): string[] {
		if (!prArray[0])
			return [];
		const subtable = {
			"he": ["him", "his"],
			"she": ["her" , "hers"],
			"it": ["it", "its"],
			"they": ["them", "their"],
		} as Record<string, string[]>;
		const first = prArray[0];
		const subtableEntry : string[] = subtable[first];
		if (!subtableEntry) return prArray;
		for (let i = 1; i <= subtableEntry.length; i++)
			if (!prArray[i])
				prArray[i] = subtableEntry[i-1];
		return prArray;
	}

	get directoryName() {
		const mythos = this.system.mythos ? ` [${this.system.mythos}]` : "";
		const owner_name = this.name + mythos;
		if (this.isOwner) {
			if (this.name != this.tokenName && this.tokenName?.length) {
				return owner_name + ` / ${this.tokenName}`;
			}
			return owner_name;
		}
		return this.tokenName ?? this.name;
	}

	get tokenName() {
		return this.prototypeToken.name;
	}

	getDisplayedName() {
		if (this.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME)
			return "Scene";
		if (this.isToken && this.token)
			return this.token.name;
		const controlled = () => {
			const tokens = this.getActiveTokens();
			const controlled = tokens.find(tok => tok.controlled);
			if (controlled)
				return controlled.name;
			const owned = canvas?.tokens?.ownedTokens?.find(tok => tok.actor == this);
			if (owned)
				return owned.name;
			return null;
		};
		return this?.token?.name
			?? controlled()
			?? this?.token?.name
			?? this?.prototypeToken?.name
			?? this?.name
			?? "My Name is Error";
	}

	getDependencies(): CityActor[] {
		switch (this.type) {
			case "crew":
				if (this.isOwner) {
					return (game.actors.contents as CityActor[])
						.filter ( (act: CityActor) => {
						return act.type == "character"
							&& act.isOwner
							&& act.crewTheme?.parent == this;
					}) as CityActor[];
				}
				break;
			case "threat":
				if (this.name == SceneTags.SCENE_CONTAINER_ACTOR_NAME)
					return [];
				if (this.isOwner && this.getThemes().length > 0) {
					return (game.actors.contents as CityActor[])
					.filter ( (act:CityActor) => {
						return act.type == "character"
							&& act.isOwner
							&& act.activeExtra != null
							&& this.mainThemes.includes(act.activeExtra);
					}) as CityActor[];
				}
				break;
			case "character":
				return [];
			default:
				console.error(`Unknown type ${this.type}`);
				return [];
		}
		return [];
	}

	hasFlashbackAvailable(this: PC) {
		return !this.system?.flashback_used;
	}

	async expendFlashback() {
		await this.update( {"system.flashback_used" : true});
	}

	async refreshFlashback() {
		await this.update( {"system.flashback_used" : false});
	}

	async sessionEnd () {
		let items = [];
		const improvements : Improvement[] = [
			this.crewThemes.flatMap( theme=> theme.improvements()),
			this.allLinkedExtraThemes.flatMap(theme=> theme.improvements()),
			this.items.contents.flatMap( x=> x.isImprovement() ? [x]: []),
		].flat();
		for (const imp of improvements) {
			if (await imp.refreshImprovementUses())
				items.push(imp.name);
		}
		if (this.system.type == "character" && !(this as PC).hasFlashbackAvailable()) {
			await this.refreshFlashback();
			items.push("Flashback");
		}
		return items;
	}

	async moveCrewSelector(this: PC, amount: number) {
		const crewTheme = this.activeCrew;
		if (!crewTheme) return;
		const list = this.crewThemes;
		const ind = list.findIndex( x=> x.id == crewTheme.id);
		const newIndex = (ind + amount) % list.length;
		const newCrew= list[newIndex];
		const newId = newCrew.id;
		await this.update({"system.activeCrewId": newId});
		if (!game.user.isGM) {
			const msg =localize("CityOfMist.logger.action.changeActiveCrew");
			await CityLogger.modificationLog(this, msg, newCrew);
		}
	}

	async moveExtraSelector(this:PC, amount: number) {
		const activeExtra = this.activeExtra;
		if (!activeExtra) return;
		const list = this.allLinkedExtraThemes;
		const ind = list.findIndex( x=> x.id == activeExtra.id);
		const newIndex = (ind + amount) % list.length;
		const newExtra= list[newIndex];
		const newId = newExtra.id;
		await this.update({"system.activeExtraId": newId});
		if (!game.user.isGM) {
			const msg =localize("CityOfMist.logger.action.changeActiveExtra");
			await CityLogger.modificationLog(this, msg, newExtra);
		}
	}

	hasEntranceMoves() {
		return this.getGMMoves()
			.some ( x=> x.system.subtype == "entrance");
	}

	async executeEntranceMoves(token : TokenDocument<Danger>) {
		if (!game.user.isGM) return;
		if (!CityHelpers.entranceMovesEnabled())
			return;
		const moves =	this.getGMMoves()
			.filter ( x=> x.system.subtype == "entrance");
		if (CityHelpers.autoExecEntranceMoves()
			|| await HTMLTools.confirmBox(`Run enter Scene Moves for ${token.name}`, `Run Enter scene moves for ${token.name}`) ) {
			for (const move of moves) {
				await this.executeGMMove(move);
			}
		}
	}

	async executeGMMove (move: GMMove, actor ?: CityActor) {
		const {taglist, statuslist, html} = await move.prepareToRenderGMMove(this);
		const speaker = actor ? { alias: actor.getDisplayedName() } : {};
		if (await CityHelpers.sendToChat(html, speaker)) {
			await CityHelpers.processTextTagsStatuses(taglist, statuslist, this);
		}
	}

	async undoGMMove(this: Danger, move: GMMove) {
		const {taglist, statuslist} = move.formatGMMoveText(this);
		for (const {name: tagname} of taglist)
			await this.deleteStoryTagByName(tagname);
		for (const {name} of statuslist)
			await this.deleteStatusByName(name);
	}

	async addOrCreateStatus (name2: string, options: StatusCreationOptions) : Promise<Status> {
		const pips = options.pips ?? 0;
		const tier2 = options.tier;
		let status = this.hasStatus(name2);
		if (status) {
			return await status.addStatus(tier2, options);
		} else {
			return await this.createNewStatus(name2, tier2, pips, options);
		}
	}

	async undoEntranceMoves (this: Danger, token: TokenDocument<Danger>) {
		if (!game.user.isGM) return;
		if (!CityHelpers.entranceMovesEnabled())
			return;
		const moves =	this.getGMMoves()
			.filter ( x=> x.system.subtype == "entrance");
		if (CityHelpers.autoExecEntranceMoves()
			|| await HTMLTools.confirmBox(`Undo Enter Scene Moves for ${token.name}`, `Undo Enter scene moves for ${token.name}`) ) {
			for (const move of moves) {
				this.undoGMMove(move);
			}
		}
	}

	async addTemplate(this: Danger, id :string) {
		this.system.template_ids.push(id);
		return await this.update({ "system.template_ids": this.system.template_ids});
	}

	async removeTemplate(this: Danger, id: string) {
		const templates = this.system.template_ids.filter(x=> x != id);
		return await this.update({ "system.template_ids": templates});
	}

	hasTemplate(this: Danger, id: string) {
		if (!this?.system?.template_ids)
			return false;
		return this.system.template_ids.includes(id);
	}

	async onDowntime() {
		//placeholder may use later
	}

	canUseMove(this: PC, move: Move) {
		const rolltype = move.system.subtype;
		switch (rolltype) {
			case "themeclassroll":
				if (this.getNumberOfThemes(move.system.theme_class) == 0) return false;
				break;
			case "noroll":
			case "standard":
				break;
			case "SHB":
				break;
			default:
				rolltype satisfies never;
				throw new Error(`Unknown Move Type ${rolltype}`);
		}
		if (move.system.abbreviation == "FLASH" && !this.hasFlashbackAvailable())
			return false;
		if (move.hasEffectClass("MIST") && this.getNumberOfThemes("Mist") <=0)
			return false;
		if (move.hasEffectClass("MYTHOS") && this.getNumberOfThemes("Mythos") <=0)
			return false;
		return true;
	}

	purgeInvalidItems() {
		//@ts-ignore
		const invalid:  string[] = Array.from(this.items.invalidDocumentIds)
		//@ts-ignore
		invalid.forEach( id=> this.items.getInvalid(id).delete());
	}

	async createLoadoutTheme() : Promise<Theme> {
		const themebook= CityDB.getLoadoutThemebook();
		if (!themebook) {
			throw new Error("Can't create Loadout theme: No valid Loadout theme exists");
		}
		const system : Partial<Theme["system"]> = {
			themebook_id: themebook.id,
			themebook_name: themebook.name,
			unspent_upgrades: 0,
			nascent: false
		}
		const obj = {
			name: "__LOADOUT__",
			type: "theme",
			system
		};
		console.log("Loadout theme created");
		return await this.createNewItem(obj) as Theme;
	}

	async createLoadoutTag(this: PC) {
		const theme = this.loadout;
		if (!theme) throw new Error(`Can't find Loadout Theme`);
		const obj = {
			name: "Unnamed Loadout Tag",
			type: "tag",
			system: {
				subtype: "loadout",
				crispy: false,
				question_letter: "_",
				custom_tag: true,
				theme_id: theme.id,
			}
		};
		return await this.createNewItem(obj) as Tag;

	}

	async createLoadoutWeakness(this: PC, masterTagId: string) {
		const theme = this.loadout;
		if (!theme) throw new Error(`Can't find Loadout Theme`);
		const masterTag = this.loadout.tags().find(x=> x.id == masterTagId);
		if (!masterTag)
			throw new Error(`Can't find Master Tag: ${masterTagId}`);
		const obj = {
			name: "Unnamed Weakness Tag",
			type: "tag",
			system : {
				subtype: "weakness",
				crispy: false,
				question_letter: "_",
				custom_tag: true,
				parentId: masterTagId,
				theme_id: theme.id,
			}
		};
		return await this.createNewItem(obj) as Tag;
	}

	async toggleLoadoutTagActivation(this: PC, loadoutTagId: string) : Promise<boolean> {
		const theme = this.loadout;
		if (!theme) throw new Error(`Can't find Loadout Theme`);
		const tag = theme.tags().find( x=> x.id == loadoutTagId);
		if (!tag) throw new Error(`No such tag exists on loadout theme with Id ${loadoutTagId}`);
		return await tag.toggleLoadoutActivation();
	}

	async setEssence(this: PC, essence: Essence) {
		if (essence.systemName) {
			await this.update( {"system.essence" : essence.systemName});
		} else {
			await this.update( {"system.essence" : essence.id});
		}
		return this;
	}

	async clearEssence(this: PC) {
		await this.update( {"system.essence" : ""});
		return this;
	}

	get essence() : Essence | undefined {
		if (this.system.type != "character") return undefined;
		const ess = CityDB.getEssenceBySystemName(this.system.essence);
		if (ess) return ess;
		return CityDB.getEssence(this.system.essence);
	}


} //end of class



export type PC = Subtype<CityActor, "character">;
export type Danger = Subtype<CityActor, "threat">;
export type Crew = Subtype<CityActor, "crew">;


Hooks.on("updateActor", async (act) => {
	const actor = act as CityActor;
	if (actor.isDanger()) {
		await actor.updateCollectiveStatus();
	}
});
