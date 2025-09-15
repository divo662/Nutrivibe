const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="text-muted-foreground">We’re here to help.</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p>
            For account help, billing questions, or feedback, email us at
            {' '}<a href="mailto:divzeh001@gmail.com" className="text-emerald-700 underline">divzeh001@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common Questions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>How do I reset my password? Use the “Forgot password” link on the sign-in page.</li>
            <li>How do I cancel my subscription? Visit Settings → Subscription.</li>
            <li>How are meal plans generated? We combine your profile inputs with AI prompts and nutrition guidelines.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Support;


