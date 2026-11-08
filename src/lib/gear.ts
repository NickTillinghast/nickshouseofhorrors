// Amazon affiliate products for the Horror Gear page (/gear).
// To add one: grab the link from Amazon's SiteStripe bar and add an entry below.
// Categories show up as sections on the page, in the order they first appear here.
export type GearItem = {
  name: string;
  description: string;
  category: string;
  href: string;
};

export const GEAR_ITEMS: GearItem[] = [
  {
    name: "Horror apron",
    description: "Cook up something terrifying for movie night.",
    category: "Kitchen",
    href: "https://link.amazon/B07Fa6Dtk",
  },
  {
    // TODO: real name, description and category
    name: "Horror pick #2",
    description: "Another essential for movie night.",
    category: "Movie Night",
    href: "https://link.amazon/B01iDqdF4",
  },
  {
    // TODO: real name, description and category
    name: "Horror pick #3",
    description: "Another essential for movie night.",
    category: "Movie Night",
    href: "https://link.amazon/B021KzR83",
  },
];

// Groups the items by category, keeping the order above
export function gearByCategory() {
  const groups = new Map<string, GearItem[]>();
  for (const item of GEAR_ITEMS) {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  }
  return [...groups.entries()];
}
