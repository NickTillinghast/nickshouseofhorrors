import Navbar from "../../components/Navbar/Navbar";

// Every page in (pages) gets the navbar; the splash page at / does not
export default function PagesLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
