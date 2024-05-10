import { Component, Input } from '@angular/core';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';

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
    ){}


  @Input() ddb!: DynamoDb;
  loading = true;
  users: User[] = []



  async ngOnInit() {

    // this.users = await this.userBuilder.getListOfUsers(this.ddb)

    this.users = [
      {id: "0", name: "Jose Rodriguez"                , phone: "123457667457", email: "abc123@gmail.com", role: "scout", other: ""},
      {id: "1", name: "Juan Loya"                     , phone: "123458668458", email: "abc446@gmail.com", role: "scout", other: ""},
      {id: "2", name: "Carlos Loya"                   , phone: "123454664454", email: "abc578@gmail.com", role: "scout", other: ""},
      {id: "3", name: "Angel Mihai Castro Ortiz"      , phone: "123452662452", email: "abc343@gmail.com", role: "coach", other: "ALBA"},
      {id: "4", name: "Roberto Jaimes López"          , phone: "123453663453", email: "abc457@gmail.com", role: "coach", other: "ROQUI"},
      {id: "5", name: "Gabriel Alvarez Matzumara"     , phone: "123459669459", email: "abc375@gmail.com", role: "coach", other: "LOBOS"},
      {id: "6", name: "Arturo Adrián Méndez Gutiérrez", phone: "123450660450", email: "abc346@gmail.com", role: "coach", other: "GANSOS"},
    ]

    this.loading = false;
  }

}
