import { Component, Input } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { UserBuilder } from '../../Builders/user-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { Role } from 'src/app/enum/Role';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';

export interface User {
  id: string
  name: string
  phone: string
  email: string
  role: string
  year: string
  other: string
}

@Component({
  selector: 'app-view-users',
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.scss']
})
export class ViewUsersComponent {

  constructor(
      private authService: AuthService,
      private userBuilder: UserBuilder,
      private teamBuilder: TeamBuilder
    ){}


  @Input() ddb!: DynamoDb;
  loading = true;
  users: User[] = []
  inactiveUsers: User[] = []


  async ngOnInit() {

    let coaches = await this.userBuilder.getAllCoaches(this.ddb);
    let scouts = await this.userBuilder.getAllScouts(this.ddb);
    let teams = await this.teamBuilder.getTeams(this.ddb);

    this.users = []

    coaches.forEach(element => {
      let teamNames = teams.filter((team)=>team.coachId == element.id).map((team) => team.name);
      if (element.year === TOURNAMENT_YEAR){
        this.users.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.admin ? Role.ADMIN : element.role, year: element.year, other: teamNames.join(",")})
      } else {
        this.inactiveUsers.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.admin ? Role.ADMIN : element.role, year: element.year!, other: teamNames.join(",")})
      }
    });

    scouts.forEach(element => {
      if (element.year === TOURNAMENT_YEAR){
        this.users.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.admin ? Role.ADMIN : element.role, year: element.year, other: ""})
      } else {
        this.inactiveUsers.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.admin ? Role.ADMIN : element.role, year: element.year!, other: ""})
      }
    });

    this.users = this.users.sort((a, b) => a.name!.localeCompare(b.name!))
    this.users = this.users.sort((a, b) => a.role!.localeCompare(b.role!))

    this.loading = false;
  }

}
