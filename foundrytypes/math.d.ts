interface Math {
	/**
	NOTE: V12+ only
		*/
	clamp(target: number, min: number, max: number) : number;
	/**
	@deprecated in V12, use Math.clamp instead
	*/
	clamped(target: number, min: number, max: number) : number;
}
