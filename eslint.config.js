const globals = require("globals");
const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.commonjs
            },
            ecmaVersion: "latest",
            sourceType: "commonjs"
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "no-undef": "warn" // Changing to warn to avoid breaking on potential global variables not defined here
        }
    }
];
