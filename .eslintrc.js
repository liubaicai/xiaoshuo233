module.exports = {
	"extends": "airbnb-base", // Airbnb 风格
	rules: {
		"object-shorthand": ["error", "always", { "avoidExplicitReturnArrows": true }],
		"no-continue": 0,
		"no-restricted-syntax": 0,
		"import/no-named-as-default-member": 0,
		"comma-dangle": ["error", "never"],
		"camelcase": [0, {"properties": "always"}],
		"spaced-comment": [0, "always"],
		"func-names": 0,
		"no-await-in-loop": 0,
		"radix": 0,
		"indent": [2, 4],
		"no-console": 0,
		"semi": [2, "never"],
		"space-before-function-paren": ["error", "always"],
		"template-curly-spacing": ["error", "always"],
		"no-underscore-dangle": 0,
		"no-param-reassign": 0,
		"arrow-body-style": ["error", "always"],
		"max-len": ["error", 120, 4, { "ignoreUrls": true, "ignoreTrailingComments": true }],
		"import/no-unresolved": [2, { "ignore": ["vant-weapp"] }]
	},
	globals: {
		wx: null,
		App: null,
		Page: null,
		getApp: null,
		Component: null,
	},
};
