import Navbar from "../../components/Navbar/Navbar";
import FavoritesProvider from "../../components/Favorites/FavoritesProvider";

// Every page in (pages) gets the navbar and the signed-in user's hearts; the splash page at / does not
export default function PagesLayout({ children }: LayoutProps<"/">) {
  return (
    <FavoritesProvider>
      <Navbar />
      {children}
    </FavoritesProvider>
  );
}
