import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-ink">
          Casa Perea
        </h1>
        <p className="mt-1 text-center text-sm text-ink-soft">
          Coto CU10053 · Cuenca
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-ink-soft">
          El acceso lo da un admin. Si no tienes cuenta, pídesela.
        </p>
      </div>
    </div>
  );
}
