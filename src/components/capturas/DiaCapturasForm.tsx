"use client";

import { useMemo, useState } from "react";
import type { TipoCaptura } from "@/lib/supabase/database.types";
import type { CapturaRow, JornadaAsistenteRow } from "@/lib/offline/db";
import type { UsuarioBasico } from "@/lib/data/usuarios";
import { crearCaptura, borrarCaptura } from "@/lib/data/capturas";
import { marcarAsistente, quitarAsistente } from "@/lib/data/jornada-asistentes";
import { FotoPicker } from "@/components/FotoPicker";
import { subirFoto } from "@/lib/data/fotos";
import { ESPECIES, iconoEspecie } from "@/lib/capturas-especies";
import { BottomSheet } from "@/components/BottomSheet";

// Formulario del "día de caza": elegir fecha y añadir directamente las
// capturas de cada cazador (marca su asistencia automáticamente); "Quién
// estuvo" es solo para apuntar a alguien que no cazó nada ese día. La
// fecha se bloquea en cuanto el día ya tiene algo guardado, para no dejar
// asistentes/capturas huérfanos bajo la fecha vieja.
export function DiaCapturasForm({
  fechaInicial,
  usuarios,
  nombres,
  userId,
  asistentes,
  capturas,
  onAsistenteAgregado,
  onAsistenteQuitado,
  onCapturaAgregada,
  onCapturaBorrada,
  onCerrar,
}: {
  fechaInicial: string;
  usuarios: UsuarioBasico[];
  nombres: Record<string, string>;
  userId: string | null;
  asistentes: JornadaAsistenteRow[];
  capturas: CapturaRow[];
  onAsistenteAgregado: (row: JornadaAsistenteRow) => void;
  onAsistenteQuitado: (id: string) => void;
  onCapturaAgregada: (row: CapturaRow) => void;
  onCapturaBorrada: (id: string) => void;
  onCerrar: () => void;
}) {
  const [fecha, setFecha] = useState(fechaInicial);
  const fechaBloqueada = asistentes.length > 0 || capturas.length > 0;
  const idsAsistentes = useMemo(() => new Set(asistentes.map((a) => a.cazador_id)), [asistentes]);

  const [tipo, setTipo] = useState<TipoCaptura>("captura");
  const [especie, setEspecie] = useState(ESPECIES[0]);
  const [cantidad, setCantidad] = useState("");
  const [cazadorIdElegido, setCazadorIdElegido] = useState("");
  const [notas, setNotas] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [guardandoAsistenteId, setGuardandoAsistenteId] = useState<string | null>(null);
  const [guardandoCaptura, setGuardandoCaptura] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se puede elegir cualquiera del grupo como cazador, no hace falta
  // marcarlo antes en "Quién estuvo" — al añadir su captura queda marcado
  // como presente automáticamente. Si la elección guardada ya no existe en
  // la lista de usuarios, se cae a el primero en vez de guardar ese ajuste
  // en un efecto aparte.
  const cazadorId = usuarios.some((u) => u.id === cazadorIdElegido)
    ? cazadorIdElegido
    : (usuarios[0]?.id ?? "");

  async function toggleAsistente(usuario: UsuarioBasico) {
    setGuardandoAsistenteId(usuario.id);
    try {
      const existente = asistentes.find((a) => a.cazador_id === usuario.id);
      if (existente) {
        await quitarAsistente(existente.id);
        onAsistenteQuitado(existente.id);
      } else {
        const row = await marcarAsistente(fecha, usuario.id);
        onAsistenteAgregado(row);
      }
    } finally {
      setGuardandoAsistenteId(null);
    }
  }

  async function handleAgregarCaptura(e: React.FormEvent) {
    e.preventDefault();
    if (!cazadorId) return;
    setGuardandoCaptura(true);
    setError(null);
    let foto_url: string | null = null;
    if (fotoFile) {
      setSubiendoFoto(true);
      try {
        foto_url = await subirFoto("capturas", fotoFile);
      } catch {
        setError("No se ha podido subir la foto (¿sin conexión?) — se guarda sin ella.");
      } finally {
        setSubiendoFoto(false);
      }
    }
    try {
      if (!idsAsistentes.has(cazadorId)) {
        const asistenteRow = await marcarAsistente(fecha, cazadorId);
        onAsistenteAgregado(asistenteRow);
      }
      const row = await crearCaptura({
        tipo,
        especie,
        cantidad: Math.max(1, Math.floor(Number(cantidad)) || 1),
        fecha,
        cazador_id: cazadorId,
        notas: notas.trim() || null,
        lat: null,
        lng: null,
        foto_url,
      });
      onCapturaAgregada(row);
      setCantidad("");
      setNotas("");
      setFotoFile(null);
    } finally {
      setGuardandoCaptura(false);
    }
  }

  async function handleBorrarCaptura(id: string) {
    await borrarCaptura(id);
    onCapturaBorrada(id);
  }

  return (
    <BottomSheet onBackdropClick={onCerrar} scrollable>
      <h2 className="text-base font-semibold text-ink">Día de caza</h2>

      <div className="mt-3 flex flex-col gap-1">
        <label htmlFor="dia-fecha" className="text-sm font-medium text-ink">
          Fecha
        </label>
        <input
          id="dia-fecha"
          type="date"
          value={fecha}
          disabled={fechaBloqueada}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Quién estuvo</span>
        <div className="flex flex-wrap gap-2">
          {usuarios.map((u) => {
            const activo = idsAsistentes.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                disabled={guardandoAsistenteId === u.id}
                onClick={() => void toggleAsistente(u)}
                className={`rounded-full border px-3 py-2 text-sm font-medium disabled:opacity-60 ${
                  activo ? "border-primary bg-primary/10 text-primary" : "border-border text-ink-soft"
                }`}
              >
                {activo ? "✓ " : ""}
                {u.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {capturas.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Capturas del día</span>
          <ul className="flex flex-col gap-1">
            {capturas.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  {c.foto_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL de Supabase Storage
                    <img src={c.foto_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                  )}
                  <span className="text-ink">
                    {c.tipo === "captura" ? iconoEspecie(c.especie) : "👁"} {c.especie}
                    {c.cantidad > 1 ? ` ×${c.cantidad}` : ""} —{" "}
                    <span className="text-ink-soft">{nombres[c.cazador_id] ?? "—"}</span>
                  </span>
                </div>
                {c.registrado_por === userId && (
                  <button
                    type="button"
                    onClick={() => void handleBorrarCaptura(c.id)}
                    className="shrink-0 text-xs text-alert"
                  >
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {usuarios.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No hay cazadores dados de alta todavía.</p>
      ) : (
        <form onSubmit={handleAgregarCaptura} className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <span className="text-sm font-medium text-ink">Añadir captura/avistamiento</span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("captura")}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                tipo === "captura"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border text-ink-soft"
              }`}
            >
              🎯 Captura
            </button>
            <button
              type="button"
              onClick={() => setTipo("avistamiento")}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                tipo === "avistamiento"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border text-ink-soft"
              }`}
            >
              👁 Avistamiento
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dia-cazador" className="text-sm font-medium text-ink">
              Cazador
            </label>
            <select
              id="dia-cazador"
              value={cazadorId}
              onChange={(e) => setCazadorIdElegido(e.target.value)}
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dia-especie" className="text-sm font-medium text-ink">
              Especie
            </label>
            <select
              id="dia-especie"
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            >
              {ESPECIES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dia-cantidad" className="text-sm font-medium text-ink">
              Cantidad
            </label>
            <input
              id="dia-cantidad"
              type="number"
              min={1}
              placeholder="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dia-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="dia-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <FotoPicker onFileChange={setFotoFile} />

          {error && <p className="text-sm text-alert">{error}</p>}

          <button
            type="submit"
            disabled={guardandoCaptura}
            className="rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {subiendoFoto ? "Subiendo foto…" : guardandoCaptura ? "Guardando…" : "Añadir"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onCerrar}
        className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
      >
        Cerrar
      </button>
    </BottomSheet>
  );
}
