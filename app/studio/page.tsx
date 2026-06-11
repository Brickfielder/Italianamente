import { redirect } from "next/navigation";

import { auth, isStudioConfigured, signIn } from "../../auth";
import { loadStudioDocuments } from "../../lib/studio/load";
import StudioApp from "./studio-app";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const demoMode =
    process.env.NODE_ENV !== "production" &&
    process.env.STUDIO_DEMO_MODE === "true";

  if (!isStudioConfigured() && !demoMode) {
    return (
      <main className="studio-gate">
        <section>
          <p className="studio-wordmark">Italianamente Studio</p>
          <h1>Configurazione richiesta</h1>
          <p>
            Studio è installato, ma deve ancora essere collegato a Neon,
            Resend, Vercel Blob e GitHub. Le variabili richieste sono elencate
            in <code>.env.example</code>.
          </p>
        </section>
      </main>
    );
  }

  if (demoMode) {
    const documents = await loadStudioDocuments();
    return (
      <StudioApp
        initialDocuments={documents}
        userEmail="demo locale"
        demoMode
      />
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    const requestMagicLink = async (formData: FormData) => {
      "use server";
      const email = String(formData.get("email") ?? "");
      await signIn("resend", { email, redirectTo: "/studio" });
    };

    return (
      <main className="studio-gate">
        <form action={requestMagicLink}>
          <p className="studio-wordmark">Italianamente Studio</p>
          <h1>Accedi per modificare il sito</h1>
          <label htmlFor="studio-email">Email autorizzata</label>
          <input id="studio-email" name="email" type="email" required />
          <button type="submit">Invia link di accesso</button>
        </form>
      </main>
    );
  }

  if (
    session.user.email.toLowerCase() !==
    process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase()
  ) {
    redirect("/");
  }

  const documents = await loadStudioDocuments();
  return <StudioApp initialDocuments={documents} userEmail={session.user.email} />;
}
