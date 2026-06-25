import tseslint from "typescript-eslint";

export default tseslint.config(...tseslint.configs.recommended, {
  ignores: ["dist/**", ".astro/**", "node_modules/**", "*.mjs"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "off",
  },
});
