import TopTrustBar from "@/Components/Pages/GetFreeMovingQuotePage/TopTrustBar";
import ResponsiveNavbar from "./ResponsiveNavbar/ResponsiveNavbar";
export default function Header({ localSections = false }) {
  return (
    <>
      <TopTrustBar />
      <ResponsiveNavbar localSections={localSections} />
      <div className="header-offset" aria-hidden="true" />
    </>
  );
}
