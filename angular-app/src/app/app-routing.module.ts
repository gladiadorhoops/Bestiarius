import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcercaComponent } from './acerca/acerca.component';
import { InicioComponent } from './inicio/inicio.component';
import { TorneoComponent } from './torneo/torneo.component';
import { PatrociniosComponent } from './patrocinios/patrocinios.component';
import { TurismoComponent } from './turismo/turismo.component';
import { RedesSocialesComponent } from './redes-sociales/redes-sociales.component';
import { FotosComponent } from './fotos/fotos.component';
import { TorneospasadosComponent } from './torneospasados/torneospasados.component';

const routes: Routes = [
  { path: 'inicio-component', component: InicioComponent },
  { path: 'acerca-component', component: AcercaComponent },
  { path: 'torneo-component', component: TorneoComponent },
  { path: 'redes-sociales-component', component: RedesSocialesComponent },
  { path: 'patrocinios-component', component: PatrociniosComponent },
  { path: 'turismo-component', component: TurismoComponent },
  { path: 'fotos-component', component: FotosComponent },
  { path: 'torneospasados-component', component: TorneospasadosComponent },
  { path: '**', component: InicioComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
