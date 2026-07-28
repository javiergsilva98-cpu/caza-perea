"use client";

import { useState } from "react";

interface Resultado {
  email: string;
  password: string;
}

export function InvitarUsuarioPanel() {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [comoAdmin, setComoAdmin] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/invitar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, comoAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se ha podido crear el usuario");
      setResultado({ email: data.email, password: data.password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setAbierto(false);
    setNombre("");
    setEmail("");
    setComoAdmin(false);
    setResultado(null);
    setError(null);
    setCopiado(false);
  }

  const mensajeCompartir = resultado
    ? `Te he dado de alta en Casa Perea.\nEmail: ${resultado.email}\nContraseña: ${resultado.password}\n\nEntra en caza-perea.vercel.app y cámbiala cuando quieras desde tu perfil.`
    : "";

  async function copiarMensaje() {
    await navigator.clipboard.writeText(mensajeCompartir);
    setCopiado(true);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
      >
        + Invitar cazador
      </button>
    );
  }

  if (resultado) {
    return (
      <div className="rounded-xl border border-emerald-700/30 bg-emerald-800/5 p-4">
        <p className="text-sm font-medium text-foreground">
          Cuenta creada para {resultado.email}
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          Guarda o comparte esto ahora — no se puede volver a ver.
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-xs text-foreground dark:bg-black/30">
          {mensajeCompartir}
        </pre>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={reiniciar}
            className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={copiarMensaje}
            className="flex-1 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-medium text-white"
          >
            {copiado ? "Copiado ✓" : "Copiar mensaje"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
    >
      <p className="text-sm font-medium text-foreground">Invitar cazador</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="invitar-nombre" className="text-xs font-medium text-foreground/70">
          Nombre
        </label>
        <input
          id="invitar-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 dark:border-white/15 dark:bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="invitar-email" className="text-xs font-medium text-foreground/70">
          Email
        </label>
        <input
          id="invitar-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 dark:border-white/15 dark:bg-white/5"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/70">
        <input
          type="checkbox"
          checked={comoAdmin}
          onChange={(e) => setComoAdmin(e.target.checked)}
        />
        Darle también rol de administrador
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reiniciar}
          className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {enviando ? "Creando…" : "Crear cuenta"}
        </button>
      </div>
    </form>
  );
}
