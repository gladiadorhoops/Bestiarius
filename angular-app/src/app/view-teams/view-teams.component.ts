import { Component, Input } from '@angular/core';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';


export interface Team {
  id: string
  name: string
  coachId: string
  category: string
  location: string
}

@Component({
  selector: 'app-view-teams',
  templateUrl: './view-teams.component.html',
  styleUrls: ['./view-teams.component.scss']
})
export class ViewTeamsComponent {

  constructor(
      private authService: AuthService,
    ){}


  @Input() ddb!: DynamoDb;
  loading = true;
  teams: Team[] = [];
  isAdmin = false;
  isScout = false;
  isCoach = false;

  
  reloadLoginStatus() {
    let userrole = this.authService.getUserRole();
    
    this.isAdmin = false;
    this.isScout = false;
    this.isCoach = false;

    if(userrole == "admin"){
      this.isAdmin = true;
      this.isScout = true;
      this.isCoach = true;
    }
    if(userrole == "scout"){
      this.isAdmin = true;
    }
    if(userrole == "coach"){
      this.isCoach = true;
    }
  }

  async ngOnInit() {

    this.reloadLoginStatus()
    
    // this.users = await this.userBuilder.getListOfUsers(this.ddb)

    this.teams = [
      {id: "0", name: "ALBA"   , coachId: "123", category: "aprendiz", location: "Lerdo, Durango"},
      {id: "1", name: "LOBOS"  , coachId: "356", category: "aprendiz", location: "CDMX"},
      {id: "2", name: "ROQUI"  , coachId: "345", category: "elite",    location: "Mexico"},
      {id: "3", name: "GANSOS" , coachId: "245", category: "elite",    location: "Jimenez, Chihuahua"}
    ]

    this.loading = false;
  }

}
