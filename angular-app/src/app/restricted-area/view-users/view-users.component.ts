import { Component, Input } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { UserBuilder } from '../../Builders/user-builder';
import { TeamBuilder } from '../../Builders/team-builder';

export interface User {
  id: string
  name: string
  phone: string
  email: string
  role: string
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



  async ngOnInit() {

    let coaches = await this.userBuilder.getCoaches(this.ddb);
    let scouts = await this.userBuilder.getScouts(this.ddb);
    let admins = await this.userBuilder.getAdmins(this.ddb);
    let teams = await this.teamBuilder.getTeams(this.ddb);

    this.users = []

    coaches.forEach(element => {
      let teamNames = teams.filter((team)=>team.coachId == element.id).map((team) => team.name);
      this.users.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.role, other: teamNames.join(",")})
    });

    scouts.forEach(element => {
      this.users.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.role, other: ""})
    });

    admins.forEach(element => {
      this.users.push({id: element.id, name: element.name, phone: element.phone, email: element.email, role: element.role, other: ""})
    });

    this.loading = false;
  }

}
