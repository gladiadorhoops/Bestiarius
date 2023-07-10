import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcercaComponent } from './acerca/acerca.component';
import { InicioComponent } from './inicio/inicio.component';
import { ResultadosComponent } from './resultados/resultados.component';
import { MarcadoresComponent } from './marcadores/marcadores.component';
import { TorneoComponent } from './torneo/torneo.component';
import { PatrociniosComponent } from './patrocinios/patrocinios.component';
import { TurismoComponent } from './turismo/turismo.component';
import { RedesSocialesComponent } from './redes-sociales/redes-sociales.component';
import { FotosComponent } from './fotos/fotos.component';
import { TorneospasadosComponent } from './torneospasados/torneospasados.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component'
import { ScoutsComponent } from './scouts/scouts.component'

const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  { path: 'acerca', component: AcercaComponent },
  { path: 'resultados', component: ResultadosComponent },
  { path: 'marcadores', component: MarcadoresComponent },
  { path: 'torneo', component: TorneoComponent },
  { path: 'redes-sociales', component: RedesSocialesComponent },
  { path: 'patrocinios', component: PatrociniosComponent },
  { path: 'turismo', component: TurismoComponent },
  { path: 'fotos', component: FotosComponent },
  { path: 'torneospasados', component: TorneospasadosComponent },
  { path: 'evaluacion', component: EvaluacionComponent },
  { path: 'scouts', component: ScoutsComponent },
  { path: '**', component: InicioComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
