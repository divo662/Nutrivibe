const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
          <p>
            These Terms of Service ("Terms") constitute a binding agreement between you and NutriVibe
            ("we", "our", "us") governing your access to and use of the NutriVibe platform, including
            our websites, mobile experiences, content, and related services (collectively, the "Services").
            By accessing or using the Services, you agree to be bound by these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Eligibility and Accounts</h2>
          <p>
            You must be at least 13 years old to use the Services. When you create an account, you
            agree to provide accurate information and to maintain the security of your credentials.
            You are responsible for all activity under your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Nutrition Disclaimer</h2>
          <p>
            NutriVibe provides AI-assisted meal plans and nutritional information for educational
            and informational purposes only. We are not a medical organization and do not provide
            medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional
            before making dietary changes, especially if you have conditions such as diabetes,
            allergies, pregnancy, or other health concerns.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
          <p>
            You agree not to misuse the Services, including by attempting to disrupt, reverse engineer,
            or access data without authorization, or by using the Services to create harmful, misleading,
            or unlawful content. We may suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Subscription, Billing, and Cancellation</h2>
          <p>
            Certain features require a paid subscription. Fees, billing cycles, and plan benefits are
            disclosed at checkout. Subscriptions renew automatically until cancelled. You may cancel at
            any time, effective at the end of the current billing period. We reserve the right to update
            pricing with notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
          <p>
            The Services and all related content, trademarks, logos, and intellectual property are owned
            by NutriVibe or our licensors. You receive a limited, non-exclusive, non-transferable license
            to use the Services for personal, non-commercial purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. User Content</h2>
          <p>
            You retain ownership of content you submit to the Services. By submitting content, you grant
            NutriVibe a worldwide, non-exclusive, royalty-free license to host, display, and process such
            content solely for operating and improving the Services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, NutriVibe is not liable for indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or data arising from your
            use of the Services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Changes to the Services and Terms</h2>
          <p>
            We may modify the Services or these Terms to reflect changes in our business or legal
            requirements. Material changes will be communicated, and continued use constitutes acceptance
            of the revised Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p>
            Questions about these Terms? Contact us at <a href="mailto:divzeh001@gmail.com" className="text-emerald-700 underline">divzeh001@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;


