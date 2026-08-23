import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DemoAuthGateway } from './demo-auth.gateway';
import { DemoAuthSubjects } from './auth.models';

/**
 * Decide si esta instancia es la demo publica o un entorno de desarrollo.
 *
 * No hay bandera de compilacion: se le pregunta al backend. Asi la MISMA imagen
 * de Docker vale para los dos sitios, y el comportamiento lo decide donde esta
 * desplegada, no como se construyo. Una imagen distinta por entorno significa
 * que lo que pruebas no es lo que despliegas.
 */
@Injectable({
  providedIn: 'root',
})
export class DemoModeService {
  private readonly gateway = inject(DemoAuthGateway);

  private readonly state = signal<'desconocido' | 'demo' | 'desarrollo'>('desconocido');
  private readonly subjectsState = signal<DemoAuthSubjects>({});
  private probe: Promise<void> | null = null;

  readonly mode = this.state.asReadonly();
  readonly isDemo = computed(() => this.state() === 'demo');
  readonly subjects = this.subjectsState.asReadonly();

  /** Se resuelve una sola vez; las llamadas siguientes reutilizan la promesa. */
  resolve(): Promise<void> {
    this.probe ??= firstValueFrom(this.gateway.listSubjects())
      .then((subjects) => {
        this.subjectsState.set(subjects ?? {});
        this.state.set('demo');
      })
      .catch(() => {
        // 404 o 401: este backend no expone la puerta de la demo.
        this.state.set('desarrollo');
      });
    return this.probe;
  }
}
