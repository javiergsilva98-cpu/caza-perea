"use client";

import { useState } from "react";

export function FotoPicker({
  label = "Foto",
  fotoActualUrl,
  onFileChange,
}: {
  label?: string;
  fotoActualUrl?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  const mostrar = previewUrl ?? fotoActualUrl;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink">{label}</span>
      {mostrar && (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo local o una URL de Supabase Storage, no una imagen del propio sitio
        <img src={mostrar} alt="" className="h-32 w-full rounded-lg object-cover" />
      )}
      <label className="mt-1 rounded-lg border border-border px-4 py-3 text-center text-sm text-ink">
        {mostrar ? "Cambiar foto" : "Añadir foto"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
