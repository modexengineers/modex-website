"use client";

import { FormEvent, useState } from "react";
import styles from "./admin.module.css";

export default function AdminLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "admin", code }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to sign in.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <div className={styles.logoLockup}>
          <img src="/logo/modex-logo.svg" alt="Modex Engineers Architects" />
          <div><strong>Website Admin</strong><span>Projects & portfolio management</span></div>
        </div>
        <div className={styles.loginCopy}>
          <span>MODEX INTERNAL</span>
          <h1>Manage the public portfolio without touching code.</h1>
          <p>Add projects, upload images, choose featured work and update project details from one clean workspace.</p>
        </div>
        <form onSubmit={submit} className={styles.loginForm}>
          <label>Admin passcode<input autoFocus type="password" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter passcode" /></label>
          <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Open Website Admin"}</button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
        <a className={styles.backLink} href="/">← Back to website</a>
      </section>
    </main>
  );
}
