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
import { ResultadosComponent } from './resultados/resultados.component';
import { MarcadoresComponent } from './marcadores/marcadores.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { MarcadorFormComponent } from './marcador-form/marcador-form.component';
import { ResultadosEvaluacionComponent } from './resultados-evaluacion/resultados-evaluacion.component';
import { BracketsComponent } from './brackets/brackets.component';
import { GroupsComponent } from './groups/groups.component';
import { MatchGeneratorComponent } from './match-generator/match-generator.component';
import { MatchEditorComponent } from './match-editor/match-editor.component';
import { StandingMatchesComponent } from './standing-matches/standing-matches.component';
import { AddPlayerComponent } from './add-player/add-player.component';
import { AddTeamComponent } from './add-team/add-team.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { RestrictedAreaComponent } from './restricted-area/restricted-area.component';
import { ViewUsersComponent } from './view-users/view-users.component';
import { ViewTeamsComponent } from './view-teams/view-teams.component';

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
    ViewTeamsComponent
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
