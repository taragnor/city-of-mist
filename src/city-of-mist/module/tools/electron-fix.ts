export const electronFix = function () {
	console.debug("running electron fix");
	if (String.prototype.replaceAll == undefined) {
    //@ts-expect-error not a great replacement, patch fix probably not even neeeded
		String.prototype.replaceAll = function (this: string, regex: string, replacementString:string) {
			const REnew = new RegExp(regex.toString(), "g");
			return this.replace(REnew, replacementString);
		};
	}
};

electronFix();
