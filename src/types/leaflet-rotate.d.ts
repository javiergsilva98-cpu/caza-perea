// @types/leaflet-rotate solo cubre setBearing/getBearing y las opciones del
// mapa; le faltan los handlers/control que se crean como propiedades de la
// instancia (map.touchRotate, map.shiftKeyRotate, map.rotateControl).
import "leaflet";

declare module "leaflet" {
  interface Map {
    touchRotate: Handler;
    shiftKeyRotate: Handler;
    rotateControl?: Control;
  }
}
