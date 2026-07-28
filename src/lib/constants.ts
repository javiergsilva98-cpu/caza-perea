// Centro aproximado del coto CU10053 (39°38'00.0"N 2°51'42.0"W),
// entre Villamayor de Santiago y Horcajo de Santiago (Cuenca).
export const FINCA_CENTER: [number, number] = [39.633333, -2.861667];
// Cada nivel de zoom de Leaflet duplica la escala. Partiendo de 15: un 30%
// más alejado es restar log2(1/0.7) ≈ 0.5 (→ 14.5), y otro 20% más sobre
// eso es restar log2(1/0.8) ≈ 0.32 (→ 14.2).
export const FINCA_DEFAULT_ZOOM = 14.2;
