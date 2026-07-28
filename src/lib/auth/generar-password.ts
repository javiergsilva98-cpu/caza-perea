import { randomBytes } from "node:crypto";

// Sin 0/O/1/l/I para no confundirlos al leer la contraseña en voz alta o
// pasarla por WhatsApp.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generarPasswordTemporal(longitud = 12): string {
  const bytes = randomBytes(longitud);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}
