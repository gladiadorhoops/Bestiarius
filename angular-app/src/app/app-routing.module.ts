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
import { GroupsComponent } from './groups/groups.component';
import { BracketsComponent } from './brackets/brackets.component';
import { StandingMatchesComponent } from './standing-matches/standing-matches.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';

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
  { path: 'login', component: LoginComponent },
  { path: 'grupos', component: GroupsComponent },
  { path: 'brackets', component: BracketsComponent },
  { path: 'standings', component: StandingMatchesComponent },
  { path: 'signup', component: SignupComponent },
  { path: '**', component: InicioComponent, data: { 
    breadcrumb: 'Gladiadores Hoops', 
    title: 'GladiadoresHoops',
    metaDescription: 'Sitio Web Torneo Gladiadores Hoops, MX', 
    metaKeywords: 'GladiadoresHoops, gladiadores, hoops, basketball, basquetbol, parral' } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
