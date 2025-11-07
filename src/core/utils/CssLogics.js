export class CssLogics {
  static camelToKebab(prop) {
    return prop.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase());
  }

  /**
   * Converts a JS-style or hybrid styleRules object into a valid CSS string.
   * Supports:
   *  - Normal objects: { "td": { textAlign: "center" } }
   *  - Raw CSS strings: { "td": "{ text-align:center; }" }
   *  - Nested selectors: { ".table": { "td": { color: "red" } } }
   *  - At-rules: { "@media (max-width:600px)": { "td": { fontSize: "12px" } } }
   *
   * @param {Object} styleObject - The style definition object.
   * @param {number} [level=0] - Internal recursion depth for formatting.
   * @returns {string} - Valid CSS text.
   */
  static objectToCSS(styleObject, level = 0) {
    if (typeof styleObject !== "object" || !styleObject) return "";

    const indent = "  ".repeat(level);

    return Object.entries(styleObject)
      .map(([selector, rules]) => {
        // If it's an @media or other at-rule
        if (selector.startsWith("@")) {
          const innerCSS = this.objectToCSS(rules, level + 1);
          return `${indent}${selector} {\n${innerCSS}\n${indent}}`;
        }

        // If it's a nested object of rules
        if (typeof rules === "object" && !Array.isArray(rules)) {
          // Check if the object is a pure declaration block (contains CSS props)
          const hasStyleProps = Object.keys(rules).some(
            (key) => typeof rules[key] !== "object"
          );

          // Case 1: Declaration block (contains CSS properties)
          if (hasStyleProps) {
            const cssText = Object.entries(rules)
              .map(([prop, value]) => {
                const kebab = this.camelToKebab(prop);
                const isImportant =
                  typeof value === "string" && value.includes("!important");
                const cleanValue = isImportant
                  ? value.replace("!important", "").trim()
                  : value;
                return `${indent}  ${kebab}: ${cleanValue}${
                  isImportant ? " !important" : ""
                };`;
              })
              .join("\n");

            return `${indent}${selector} {\n${cssText}\n${indent}}`;
          }

          // Case 2: Nested selectors (e.g., ".table": { "td": {...} })
          const nestedCSS = this.objectToCSS(rules, level + 1);
          return nestedCSS;
        }

        // If user passed a raw CSS string (already formatted)
        if (typeof rules === "string") {
          return `${indent}${selector} ${rules.trim()}`;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
}
