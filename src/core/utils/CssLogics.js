export class CssLogics {
  static camelToKebab(prop) {
    return prop.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase());
  }

  static objectToCSS(styleObject) {
    return Object.entries(styleObject)
      .map(([selector, rules]) => {
        const ruleText = Object.entries(rules)
          .map(([prop, value]) => `${this.camelToKebab(prop)}: ${value};`)
          .join(" ");
        return `${selector} { ${ruleText} }`;
      })
      .join("\n");
  }
}
