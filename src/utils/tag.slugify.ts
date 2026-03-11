const slugify = require("slugify");

export const tagSlugify = (name: string): string => {
  if (!name) return "";
  return slugify(name, {
    replacement: "-",
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    locale: "tr",
  });
};
