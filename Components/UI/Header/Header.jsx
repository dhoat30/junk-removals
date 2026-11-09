import TopTrustBar from "@/Components/Pages/GetFreeMovingQuotePage/TopTrustBar";
import ResponsiveNavbar from "./ResponsiveNavbar/ResponsiveNavbar";
export default function Header() {
  return (
    <>
      <TopTrustBar />
      <ResponsiveNavbar />
      <div className="header-offset" aria-hidden="true" />
    </>
  );
}
