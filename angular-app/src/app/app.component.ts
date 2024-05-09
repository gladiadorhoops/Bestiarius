import { Component } from '@angular/core';
import { AppService } from './app.service';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  constructor(private appService: AppService, public authService: AuthService) {}

  title = 'gladiadores-hoops';

  isLoggedIn: boolean = false;
  userrole = "";
  isAdmin = false;
  isScout = false;
  isCoach = false;

  ngOnInit(){
    this.isLoggedIn = this.authService.isLoggedIn();
    // TODO: update role
    this.isAdmin = this.authService.isLoggedIn();
    this.isScout = this.authService.isLoggedIn();
    this.isCoach = this.authService.isLoggedIn();
    this.userrole = this.authService.getUserRole();

    if(this.userrole == "admin"){
      this.isAdmin = true;
    }
    if(this.userrole == "scout"){
      this.isScout = true;
    }
    if(this.userrole == "coach"){
      this.isCoach = true;
    }
  }

  destroy$: Subject<boolean> = new Subject<boolean>();

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
