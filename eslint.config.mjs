import tseslint from "typescript-eslint";
// import js from "@eslint/js";

export default [
	// js.configs.recommended,
	...tseslint.configs.recommended, // TS plugin's recommended rules
	...tseslint.configs.recommendedTypeChecked, // 👈 enables typed rules
	{
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json", // 👈 tell ESLint where your tsconfig is
				// tsconfigRootDir: import.meta.dirname, // needed if config not in same dir
			},
		},
		rules: {
      "no-fallthrough": ["warn"],
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-explicit-any": "warn",
			// "no-console": "warn",
			// "eqeqeq": ["error", "always"],
			"curly": "error",
			"prefer-const": "error",
			// "quotes": ["error", "single", { avoidEscape: true }],
			"semi": ["error", "always"],
			"no-unsafe-optional-chaining": "error",
			"use-isnan": "error",
			"no-compare-neg-zero": "error",
			// "no-implicit-coercion": "error",
			// "indent": ["error", 2],
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/restrict-plus-operands": "error",
      "no-case-declarations": "error",
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{
					allowNumber: true,
					allowBoolean: true,
					allowNullish: true,
					allowAny: true,
					allowRegExp: false,
				},
			]
		}
	}
];
