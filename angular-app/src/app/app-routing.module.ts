import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcercaComponent } from './acerca/acerca.component';
import { InicioComponent } from './inicio/inicio.component';
import { ResultadosComponent } from './results/resultados/resultados.component';
import { MarcadoresComponent } from './results/marcadores/marcadores.component';
import { TorneoComponent } from './torneo/torneo.component';
import { PatrociniosComponent } from './patrocinios/patrocinios.component';
import { TurismoComponent } from './turismo/turismo.component';
import { RedesSocialesComponent } from './redes-sociales/redes-sociales.component';
import { FotosComponent } from './fotos/fotos.component';
import { TorneospasadosComponent } from './torneospasados/torneospasados.component';
import { EvaluacionComponent } from './restricted-area/evaluacion/evaluacion.component'
import { GroupsComponent } from './results/groups/groups.component';
import { BracketsComponent } from './results/brackets/brackets.component';
import { StandingMatchesComponent } from './results/standing-matches/standing-matches.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { RestrictedAreaComponent } from './restricted-area/restricted-area.component';
import { ResultsComponent } from './results/results.component';
import { ParticipantsComponent } from './participants/participants.component';
import { PartidosComponent } from './partidos/partidos.component';

const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  { path: 'acerca', component: AcercaComponent },
  { path: 'resultados', component: ResultadosComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'marcadores', component: MarcadoresComponent },
  { path: 'torneo', component: TorneoComponent },
  { path: 'redes-sociales', component: RedesSocialesComponent },
  { path: 'patrocinios', component: PatrociniosComponent },
  { path: 'participantes', component: ParticipantsComponent },
  { path: 'turismo', component: TurismoComponent },
  { path: 'fotos', component: FotosComponent },
  { path: 'torneospasados', component: TorneospasadosComponent },
  { path: 'evaluacion', component: EvaluacionComponent },
  { path: 'restricted', component: RestrictedAreaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'grupos', component: GroupsComponent },
  { path: 'brackets', component: BracketsComponent },
  { path: 'standings', component: StandingMatchesComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'partidos', component: PartidosComponent },
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
