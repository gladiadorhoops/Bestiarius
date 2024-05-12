import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { Team } from '../interfaces/team';
import { Coach } from '../interfaces/coach';
import { UserBuilder } from '../Builders/user-builder';


@Component({
  selector: 'app-view-teams',
  templateUrl: './view-teams.component.html',
  styleUrls: ['./view-teams.component.scss']
})
export class ViewTeamsComponent {

  constructor(
      private authService: AuthService,
      private teamBuilder: TeamBuilder,
      private userBuilder: UserBuilder
    ){}


  @Input() ddb!: DynamoDb;
  loading = true;
  teams: Team[] = [];
  coaches: Map<string,Coach> = new Map<string, Coach>;

  isAdmin = false;
  isScout = false;
  isCoach = false;
  userId = "";
  userrole = "";
  
  reloadLoginStatus() {
    this.userrole = this.authService.getUserRole();
    this.userId = this.authService.getUserId();
    
    this.isAdmin = false;
    this.isScout = false;
    this.isCoach = false;

    if(this.userrole == "admin"){
      this.isAdmin = true;
      this.isScout = true;
      this.isCoach = true;
    }
    if(this.userrole == "scout"){
      this.isAdmin = true;
    }
    if(this.userrole == "coach"){
      this.isCoach = true;
    }
  }

  async ngOnInit() {

    this.reloadLoginStatus()
    
    if (this.userrole == "coach"){
      this.teams = (await this.teamBuilder.getListOfTeams(this.ddb)).filter((t) => t.coachId == this.userId);
    }
    else{
      this.teams = await this.teamBuilder.getListOfTeams(this.ddb);
    }
    this.sortTeamsByCategory()
    let coachesList:Coach[] = await this.userBuilder.getCoaches(this.ddb);

    coachesList.forEach(coach => {
      this.coaches.set(coach.id, coach);
    });

    this.loading = false;
  }

  sortTeamsByCategory(){
    this.teams = this.teams.sort((a, b) => a.category!.localeCompare(b.category!))
  }

  sortTeamsByName(){
    this.teams = this.teams.sort((a, b) => a.name.localeCompare(b.name))
  }

  sortTeamsByLocation(){
    this.teams = this.teams.sort((a, b) => (a.location? a.location : "").localeCompare((b.location ? b.location : "")))
  }

  sortTeamsByCoach(){
    this.teams = this.teams.sort((a, b) => ((a.coachId ? this.coaches.get(a.coachId!)?.name! : "").localeCompare(b.coachId ? this.coaches.get(b.coachId!)?.name! : "")))
  }

  @Output() callAddTeam = new EventEmitter<string>();

  callParentToAddTeam() {
    this.callAddTeam.emit('callAddTeam');
  }
}
