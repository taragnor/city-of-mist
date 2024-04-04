class Scene extends FoundryDocument<never> {
	tokens: Collection<TokenDocument<Actor<any>>>
	dimensions: {distance:number};
}

