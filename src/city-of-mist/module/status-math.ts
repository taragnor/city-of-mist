import { CitySettings } from "./settings.js";

type StatusLike = {tier: number, pips?: number};

export class StatusMath {


	static merge (st1: StatusLike, st2tier: number) : StatusLike {
		return this.add(st1, st2tier);
	}

	static add(st1: StatusLike, st2tier: number) : StatusLike {
		const system = CitySettings.getStatusAdditionSystem();
		switch (system) {
			case "classic":
				return this.addCoM(st1, st2tier);
			case "classic-commutative":
				return this.addCoMCommutative(st1, st2tier);
			case "mist-engine":
				return this.addMistEngine(st1, st2tier);
			default:
				system satisfies never;
				throw new Error(`Unknwon System ${system}`);
		}

	}


	static subtract(st1: StatusLike, st2tier: number) :StatusLike {
		const system = CitySettings.getStatusSubtractionSystem();
		switch (system) {
			case "classic":
				return this.subCoM(st1, st2tier);
			case "mist-engine":
				return this.subMistEngine(st1, st2tier);
			default:
				system satisfies never;
				throw new Error(`Unknwon System ${system}`);
		}

	}

	static addCoM(st1: StatusLike, st2tier: number) : StatusLike {
		let ntier = st2tier;
		let {tier, pips = 0} = st1;
		if (ntier > tier) {
			tier = ntier;
			pips = 0;
			ntier = 0;
		}
		while (ntier-- > 0) {
			pips++;
			while (pips >= tier) {
				pips -= tier++;
			}
		}
		return {tier, pips};
	}

	static addCoMCommutative(st1: StatusLike, st2tier: number) : StatusLike {
		let ntier = st2tier;
		let {tier, pips = 0} = st1;
		if (ntier > tier) {
			[tier, ntier] = [ntier, tier]; //swap
		}
		while (ntier-- > 0) {
			pips++;
			while (pips >= tier) {
				pips -= tier++;
			}
		}
		return {tier, pips};
	}

	static addMistEngine(st1: StatusLike, st2tier: number) : StatusLike {
		let ntier = st2tier;
		const pips = this.#convertToBinaryPips(st1);
 		while (pips & (1 << ntier - 1)) {
			ntier++;
			if (ntier > 10) throw new Error("Overflow");
		}
		const newpips = pips + (1 << ntier - 1);
		return this.#convertFromBinaryPips(newpips);
	}

	static #convertToBinaryPips(st: StatusLike) : number {
		return (st.pips ?? 0) + (st.tier > 0 ? 1 << (st.tier-1) : 0);
	}

	static #convertFromBinaryPips(origpips: number) : StatusLike {
		let pips = origpips;
		let tier = 0;
		while (pips) {
			pips = pips >> 1;
			tier++;
		}
		pips = origpips   - (tier > 0 ? (1 << tier - 1) : 0);
		return {tier, pips};
	}

	static subCoM(st1: StatusLike, st2tier: number) : StatusLike {
		const ntier = st2tier;
		let {tier} = st1;
		tier = Math.max(tier - ntier, 0);
		return {tier, pips:0}
	}

	static subMistEngine(st1: StatusLike, st2tier: number) : StatusLike {
		const binary = this.#convertToBinaryPips(st1);
		const newpips = binary >> st2tier;
		return this.#convertFromBinaryPips(newpips);
	}

	/** gets filled in status boxes by tier for Mist Engine Statuses */
	static statusBoxesME(status: StatusLike): boolean[] {
		let binary = this.#convertToBinaryPips(status);
		let arr : boolean[] = [];
		while (arr.length < 6) {
			arr.push( (binary & 1)  == 1);
			binary >>= 1;
		}
		return arr;
	}

	static binaryToggle(status: StatusLike, index: number) : StatusLike {
		let toggle = 1 << index;
		let binary = this.#convertToBinaryPips(status);
		binary ^= toggle;
		return this.#convertFromBinaryPips(binary);
	}
}

//@ts-ignore
window.StatusMath = StatusMath;
