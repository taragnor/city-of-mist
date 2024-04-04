class Keybindings {
	register(scope: string, keybindName: string, options: KeybindOptions): void;


}

type KeybindOptions = {
			name: string,
			hint: string,
			uneditable: KeybindDef[ ],
			editable: KeybindDef[ ],
			onDown: Function,
			onUp: Function,
	//**GM only?*/
			restricted: boolean,
			reservedModifiers: string[],
	//**From CONST.KEYBINDING_PRECEDENCE*/
			precedence: number
}

type KeybindDef = {
	key: string,
	modifiers: string[],
};
