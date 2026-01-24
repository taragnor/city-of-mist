class FilePicker extends Application {
	constructor (options: PickerOptions);
	static FILE_TYPES = ['image', 'audio', 'video', 'text', 'imagevideo', 'font', 'folder', 'any'] as const;

	static async browse(source: FPSources, path: string, options: BrowseOptions = {}): Promise<BrowseReturn>;
	static async createDirectory(source: FPSources, path: string);

	browse(): Promise<FilePicker>;
	target: string; //path
	result: U<BrowseReturn>;

}

interface PickerOptions {
	type?: FILE_TYPES;
	callback ?: (path: string, fp: FilePicker) => unknown;
}

interface BrowseReturn {
	files: string[];
	dirs: string[];
	target: string;
	extensions: string[];
	private: boolean;
}

interface BrowseOptions {
	/** used with S3 source*/
	bucket ?: string
	/** An array of fil extensions to filter on*/
	extensions ?: string[];
	/**A requested dir represents a wildcard path*/
	wildcard ?: boolean;
}

type FPSources = "data";
