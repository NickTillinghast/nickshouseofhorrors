// Name of the signed-in user's page of hearted movies (/profile), used everywhere it's linked
export const MY_MOVIES_LABEL = "My Movies";

type NavLink = {
  href: string;
  // The page's plain name: the footer site map, and the small label under the room in the navbar
  label: string;
  // The room of the house it is, shown big in the navbar. Without one, just the label shows
  room?: string;
};

// Main pages, shared by the navbar and the footer site map
export const NAV_LINKS: NavLink[] = [
  { href: "/home", room: "The Foyer", label: "Home" },
  { href: "/movies", room: "The Screening Room", label: "Movies" },
  { href: "/quiz", room: "The Study", label: "Quiz" },
  { href: "/gear", room: "The Butcher's Kitchen", label: "Horror Gear" },
  { href: "/about", room: "The Master's Quarters", label: "About" },
  { href: "/lists", room: "The Trophy Room", label: "The Lists" },
  // Already a room of the house, so no second name
  { href: "/blood-bathroom", label: "Blood Bathroom" },
];

// Footer links to the legal pages Stripe and card networks expect a store to have
export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
];

// Footer social icons. An empty href shows the icon greyed out as "coming soon"
// TODO: add the Facebook page link
export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/NickTillinghast/nickshouseofhorrors" },
  { label: "Facebook", href: "" },
  { label: "Instagram", href: "https://www.instagram.com/nickshouseofhorrors/" },
];
