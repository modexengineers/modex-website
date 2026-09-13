import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import ContactForm from "./ContactForm";
import { site } from "@/lib/site";

export default function ContactPage(){return <><Header/><main><PageHero index="04" eyebrow="CONTACT" title={<>Your project can begin<br/><em>with a conversation.</em></>} description="Tell us about your land, requirements and budget. The Modex team can guide the next steps from planning through construction."/><section className="contact-section section-pad"><div className="shell contact-layout"><div className="contact-details"><p className="kicker">CONTACT MODEX</p><h2>Kasaragod,<br/>Kerala</h2><a href={site.phoneHref}>{site.phone}</a><a href={site.whatsapp} target="_blank" rel="noreferrer">WhatsApp ↗</a><p>Email and exact office address can be added once confirmed.</p></div><ContactForm/></div></section></main><Footer/></>}
