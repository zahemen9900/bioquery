import { NavbarHome } from "./components/NavbarHome";
import { HeaderHome } from "./components/HeaderHome";
import { Layout1 } from "./components/Layout1";
import { Layout2 } from "./components/Layout2";
import { TestimonialHome } from "./components/TestimonialHome";
import { FooterHome } from "./components/FooterHome";
export default function HomePage() {
  return (
    <div>
      <NavbarHome />
      <HeaderHome />
      <Layout1 />
      <Layout2 />
      <TestimonialHome />
      <FooterHome />
    </div>
  );
}
