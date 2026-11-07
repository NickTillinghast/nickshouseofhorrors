import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import FavoritesProvider from "../../components/Favorites/FavoritesProvider";

// Every page in (pages) gets the navbar, footer and the signed-in user's hearts; the splash page at / does not
export default function PagesLayout({ children }: LayoutProps<"/">) {
  return (
    <FavoritesProvider>
      <Navbar />
      {children}
      <Footer />
    </FavoritesProvider>
  );
}
