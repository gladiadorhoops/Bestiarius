import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcercaComponent } from './acerca/acerca.component';
import { InicioComponent } from './inicio/inicio.component';
import { FotosComponent } from './fotos/fotos.component';

const routes: Routes = [
  { path: 'inicio-component', component: InicioComponent },
  { path: 'acerca-component', component: AcercaComponent },
  { path: 'fotos-component', component: FotosComponent },
  { path: '**', component: InicioComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
