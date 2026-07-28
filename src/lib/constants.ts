// Centro aproximado del coto CU10053 (39°38'00.0"N 2°51'42.0"W),
// entre Villamayor de Santiago y Horcajo de Santiago (Cuenca).
export const FINCA_CENTER: [number, number] = [39.633333, -2.861667];
// Cada nivel de zoom de Leaflet duplica la escala, así que reducirla un
// 30% respecto al nivel anterior (15) es restar log2(1/0.7) ≈ 0.5.
export const FINCA_DEFAULT_ZOOM = 14.5;
