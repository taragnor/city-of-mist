export const electronFix = function () {
	console.debug("running electron fix");
	if (String.prototype.replaceAll == undefined) {
		String.prototype.replaceAll = function (regex, replacementString) {
			const REnew = new RegExp(regex.toString(), "g");
			return this.replace(REnew, replacementString);
		}
	}
}

electronFix();
