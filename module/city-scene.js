import {CityItem} from "./city-item.js";

export class CityScene extends Scene {
	async addTag(tagName) {
		let tagList = this.getTagList();
		if (!tagList.find(x => x.name == tagName))  {
			let item = await CityItem.create ({ name: tagName, type :"tag"});
			if (!item)
				throw new Error("Scene Tag not created");
			tagList.push(item.data);
			await this.setFlag("city-of-mist", "tags", tagList);
			await item.delete();
		} else {
			console.warn(`Duplicate Tag in Scene ${this.name} found: ${tagName}`);
		}
	}

	getTag(id) {
		const tagList = this.getTagList();
		return tagList.find ( x=> x._id == id);
	}

	async tagDialog () {
		const scene = this;
		const tagList = this.getTagList().map( x=> { 
			return {
				data: x,
				type: "tag",
				name:x.name,
				id: x._id,
				owner: scene
			};
		});
		const templateData =  {scene, tags: tagList};
		const html = await renderTemplate("systems/city-of-mist/templates/dialogs/storyTagContainer-redux.html", templateData);
		return await new Promise ( (conf, reject) => {
			//TODO: fix dialog with event handlers and non-confirm type
			Dialog.confirm({
				title:"Test Tag List",
				content: html,
				yes: () => {},
				no: () => {},
			});
		});
	}

	async deleteTagByName( name) {
		return await this.deleteTag(name , x => x.name == name);
	}

	async deleteTag(id, finderFn = (x => x._id == id) ) {
		let tagList = this.getTagList();
		const index = tagList.findIndex( x=> x._id == id);
		tagList = tagList.splice(index, 1);
		await this.setFlag("city-of-mist", "tags", tagList);
		return true;
	}

	getTagList () {
		return this.getFlag("city-of-mist", "tags") ?? [];
	}

}
