"use client";

import { FormEvent, useState } from "react";

const WHATSAPP_NUMBER = "919746117611";

export default function ContactForm() {
  const [opening, setOpening] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpening(true);
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();

    const message = [
      "Hello Modex Engineers Architects,",
      "I would like to discuss a new project.",
      "",
      `Name: ${value("name") || "—"}`,
      `Phone: ${value("phone") || "—"}`,
      `Project Type: ${value("type") || "—"}`,
      `Project Location: ${value("location") || "—"}`,
      `Plot Size: ${value("plot") || "—"}`,
      `Approx. Budget: ${value("budget") || "—"}`,
      "",
      "Project Details:",
      value("message") || "—",
      "",
      "Sent from the Modex website enquiry form.",
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="field-row"><label>Full Name<input required name="name" placeholder="Your name" /></label><label>Phone Number<input required name="phone" inputMode="tel" placeholder="+91" /></label></div>
      <div className="field-row"><label>Project Location<input required name="location" placeholder="Kasaragod / Kerala" /></label><label>Project Type<select name="type" defaultValue="Residential"><option>Residential</option><option>Commercial</option><option>Interior</option><option>Renovation</option><option>Turnkey Construction</option><option>Other</option></select></label></div>
      <div className="field-row"><label>Plot Size<input name="plot" placeholder="e.g. 12 cents" /></label><label>Approx. Budget<input name="budget" placeholder="Optional" /></label></div>
      <label>Tell us about your project<textarea name="message" rows={5} placeholder="What are you planning to build?" /></label>
      <button className="button button-dark" type="submit">{opening ? "Opening WhatsApp…" : "Continue on WhatsApp ↗"}</button>
      <p style={{fontSize:11,color:"#817b87",margin:0}}>Your details will be formatted into a WhatsApp message to Modex. You can review it before sending.</p>
    </form>
  );
}
