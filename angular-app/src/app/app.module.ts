import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MdbAccordionModule } from 'mdb-angular-ui-kit/accordion';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { MdbCheckboxModule } from 'mdb-angular-ui-kit/checkbox';
import { MdbCollapseModule } from 'mdb-angular-ui-kit/collapse';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { MdbPopoverModule } from 'mdb-angular-ui-kit/popover';
import { MdbRadioModule } from 'mdb-angular-ui-kit/radio';
import { MdbRangeModule } from 'mdb-angular-ui-kit/range';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { MdbScrollspyModule } from 'mdb-angular-ui-kit/scrollspy';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';
import { MdbTooltipModule } from 'mdb-angular-ui-kit/tooltip';
import { MdbValidationModule } from 'mdb-angular-ui-kit/validation';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AcercaComponent } from './acerca/acerca.component';
import { InicioComponent } from './inicio/inicio.component';
import { FotosComponent } from './fotos/fotos.component';
import { TorneospasadosComponent } from './torneospasados/torneospasados.component';
import { TorneoComponent } from './torneo/torneo.component';
import { RedesSocialesComponent } from './redes-sociales/redes-sociales.component';
import { PatrociniosComponent } from './patrocinios/patrocinios.component';
import { TurismoComponent } from './turismo/turismo.component';
import { ResultadosComponent } from './results/resultados/resultados.component';
import { MarcadoresComponent } from './results/marcadores/marcadores.component';
import { EvaluacionComponent } from './restricted-area/evaluacion/evaluacion.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { MarcadorFormComponent } from './restricted-area/marcador-form/marcador-form.component';
import { ResultadosEvaluacionComponent } from './restricted-area/resultados-evaluacion/resultados-evaluacion.component';
import { BracketsComponent } from './results/brackets/brackets.component';
import { GroupsComponent } from './results/groups/groups.component';
import { MatchGeneratorComponent } from './restricted-area/match-generator/match-generator.component';
import { MatchEditorComponent } from './restricted-area/match-editor/match-editor.component';
import { StandingMatchesComponent } from './results/standing-matches/standing-matches.component';
import { AddPlayerComponent } from './restricted-area/add-team/add-player/add-player.component';
import { AddTeamComponent } from './restricted-area/add-team/add-team.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { RestrictedAreaComponent } from './restricted-area/restricted-area.component';
import { ViewUsersComponent } from './restricted-area/view-users/view-users.component';
import { ViewTeamsComponent } from './restricted-area/view-teams/view-teams.component';
import { ListTeamsComponent } from './restricted-area/list-teams/list-teams.component';
import { ResultsComponent } from './results/results.component';
import { AwardsComponent } from './results/awards/awards.component';

@NgModule({
  declarations: [
    AppComponent,
    AcercaComponent,
    InicioComponent,
    FotosComponent,
    TorneospasadosComponent,
    TorneoComponent,
    RedesSocialesComponent,
    PatrociniosComponent,
    TurismoComponent,
    ResultadosComponent,
    MarcadoresComponent,
    EvaluacionComponent,
    MarcadorFormComponent,
    ResultadosEvaluacionComponent,
    BracketsComponent,
    GroupsComponent,
    MatchGeneratorComponent,
    MatchEditorComponent,
    StandingMatchesComponent,
    AddPlayerComponent,
    AddTeamComponent,
    SignupComponent,
    LoginComponent,
    RestrictedAreaComponent,
    ViewUsersComponent,
    ViewTeamsComponent,
    ListTeamsComponent,
    ResultsComponent,
    AwardsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    MdbAccordionModule,
    MdbCarouselModule,
    MdbCheckboxModule,
    MdbCollapseModule,
    MdbDropdownModule,
    MdbFormsModule,
    MdbModalModule,
    MdbPopoverModule,
    MdbRadioModule,
    MdbRangeModule,
    MdbRippleModule,
    MdbScrollspyModule,
    MdbTabsModule,
    MdbTooltipModule,
    MdbValidationModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  bootstrap: [AppComponent],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}]

})
export class AppModule { }
