const Unsubscribe = () => (
  <main className="min-h-screen flex items-center justify-center px-6 bg-background">
    <div className="w-full max-w-md border border-border p-8 text-center">
      <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Nyzora</p>
      <h1 className="text-2xl font-semibold mt-3 mb-4 text-foreground">Email preferences</h1>
      <p className="text-muted-foreground mb-6">
        Unsubscribe links in our emails now take effect the moment you click them — there's
        nothing left to confirm here.
      </p>
      <p className="text-sm text-muted-foreground">
        Still receiving something you'd rather not? Write to{" "}
        <a className="underline" href="mailto:contact@nyzora.ai">contact@nyzora.ai</a> and we'll
        remove you.
      </p>
    </div>
  </main>
);

export default Unsubscribe;
