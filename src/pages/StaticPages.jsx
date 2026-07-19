function StaticPage({ title, children }) {
  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-display text-3xl font-semibold mb-6">{title}</h1>
      <div className="prose prose-sm text-[var(--color-muted-fg)] space-y-4">{children}</div>
    </div>
  );
}

export function Privacy() {
  return (
    <StaticPage title="Privacy">
      <p>This is placeholder copy — replace with your real privacy policy before launch.</p>
    </StaticPage>
  );
}

export function Terms() {
  return (
    <StaticPage title="Terms">
      <p>This is placeholder copy — replace with your real terms of service before launch.</p>
    </StaticPage>
  );
}

export function Impressum() {
  return (
    <StaticPage title="Impressum">
      <p>This is placeholder copy — German sites require a proper Impressum with your legal name, address, and contact details before launch.</p>
    </StaticPage>
  );
}
