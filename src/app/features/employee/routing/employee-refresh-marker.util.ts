import { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Marcador que deja el flujo de recontratacion en la URL al volver al detalle.
 *
 * Lo escribe rehire-employee-page y lo leen DOS sitios distintos: el detalle,
 * que recarga sus propios datos, y el shell, que recarga el listado. Vive aqui
 * porque cuando cada uno tenia su propia copia de esta comprobacion, el listado
 * se quedo sin refrescar y nadie se entero en meses.
 */
export const REFRESH_MARKER_QUERY_PARAM = 'refresh';
export const REHIRE_REFRESH_MARKER = 'rehire';

/**
 * El marcador viaja en la rama mas profunda de la ruta, asi que hay que bajar
 * hasta la ultima hoja antes de mirarlo.
 */
export function hasRehireRefreshMarker(snapshot: ActivatedRouteSnapshot): boolean {
  let current = snapshot;
  while (current.firstChild) current = current.firstChild;
  return current.queryParamMap.get(REFRESH_MARKER_QUERY_PARAM) === REHIRE_REFRESH_MARKER;
}
