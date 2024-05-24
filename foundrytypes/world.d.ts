interface World {
	id: string;
	title: string;
	socket: boolean;
	version: null | string;
	owned: boolean;
	coreVersion: string;
	description: string;
	compatibility: {
		minimum: string;
		verified: string;
		maximum: string | undefined;
	}


}
