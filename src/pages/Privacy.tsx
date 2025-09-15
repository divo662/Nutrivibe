const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Overview</h2>
          <p>
            NutriVibe respects your privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your personal information when you use our Services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account data: name, email, authentication identifiers.</li>
            <li>Profile data: goals, dietary preferences, allergies, and related inputs you provide.</li>
            <li>Usage data: generated content, feature usage, device and log information.</li>
            <li>Payment data: handled by our payment processor; we do not store full card details.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide and improve meal plans, recipes, and shopping lists.</li>
            <li>Personalize recommendations and track subscription usage.</li>
            <li>Secure accounts, prevent fraud, and comply with legal obligations.</li>
            <li>Communicate service updates and respond to support requests.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Sharing and Disclosure</h2>
          <p>
            We may share data with service providers (e.g., hosting, analytics, payments) bound by
            confidentiality obligations. We may disclose information to comply with law or protect rights.
            We do not sell your personal information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Data Security and Retention</h2>
          <p>
            We implement technical and organizational measures to safeguard information. We retain data
            only as long as necessary for the purposes set out in this Policy or as required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p>
            Subject to applicable law, you may access, correct, or delete certain personal information.
            You may also object to processing or request portability. Contact us to exercise your rights.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Children's Privacy</h2>
          <p>
            Our Services are not directed to children under 13. We do not knowingly collect information
            from children under 13. If you believe a child provided information, contact us to remove it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. International Transfers</h2>
          <p>
            Your information may be processed outside your country of residence. We take steps to ensure
            appropriate safeguards for such transfers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>
            To ask questions or exercise rights, contact <a href="mailto:divzeh001@gmail.com" className="text-emerald-700 underline">divzeh001@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;


