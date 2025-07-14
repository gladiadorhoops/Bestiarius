import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Team, getCategories } from '../../interfaces/team';
import { Player } from '../../interfaces/player';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { PlayerBuilder } from '../../Builders/player-builder';
import {v4 as uuidv4} from 'uuid';
import { Coach } from '../../interfaces/coach';
import { UserBuilder } from '../../Builders/user-builder';
import { FeatureFlagBuilder } from 'src/app/Builders/feature-flag-builder';
import { FeatureFlag } from 'src/app/interfaces/feature-flag';


@Component({
  selector: 'app-add-team',
  templateUrl: './add-team.component.html',
  styleUrls: ['./add-team.component.scss']
})
export class AddTeamComponent {

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private userBuilder: UserBuilder,
    private playerBuilder: PlayerBuilder,
    private featureFlagBuilder: FeatureFlagBuilder
    ) {
    this.userrole = this.authService.getUserRole();

  }

  @Input() ddb!: DynamoDb;

  userId = this.authService.getUserId();
  userName = this.authService.getUserName();
  categories = getCategories();
  teamForm =  this.fb.group({
    coachId: ['', Validators.required],
    teamName: ['', Validators.required],
    category: ['', Validators.required],
    location: [''],
    captainId: ['']
  });
  userrole: string;

  coaches: Coach[] = [];
  teams: Team[] = [];
  teamplayers: Player[] = [];
  selectedCaptan : boolean = false;
  showAddNewPlayer : boolean = false;

  selectedCategoria: string = "";
  selectedTeamName: string = "";
  selectedTeamId: string = "";
  popUpMsg = "";
  displayStyle = "none";
  addPlayerDisplayStyle = "none";
  featureFlags: FeatureFlag | undefined = undefined
  editable = true;

  saved: boolean = false;

  async ngOnInit() {
    if(this.userrole != "coach"){
      this.coaches = await this.userBuilder.getCoaches(this.ddb);
    }

    this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
    this.editable = this.featureFlags ? this.featureFlags.editTeams : false;
    
  }


  async validateTeam() {
    this.teams = []
    this.selectedCategoria = this.teamForm.value.category!
    let teams = await this.teamBuilder.getTeamsByCategory(this.ddb, this.selectedCategoria).then(
      (output) => {
        return output
      }
    )
    this.teams = this.teams.concat(teams)
    this.selectedTeamName = this.teamForm.value.teamName!;
    this.teams.forEach(
      async (team) => {
        if(team.name == this.selectedTeamName){
          this.selectedTeamId = team.id;
        }
    });
    if(this.selectedTeamId!=""){
      return false
    }
    this.selectedTeamId = uuidv4();
    return true
  }

  async onSubmit() {
    let selectedCoachId = this.userId;
    let selectedCoachName = this.userName;
    if(this.userrole != "coach"){
      selectedCoachId = this.teamForm.value.coachId!;
      let selectedCoach = this.coaches.filter((c)=>c.id === selectedCoachId);
      if(selectedCoach.length != 1){
        this.popUpMsg = "Coach not found!";
        this.openPopup();
        return;
      }
      selectedCoachName = selectedCoach[0].name!;
    }

    if (!await this.validateTeam()){
      this.popUpMsg = "Este equipo ya existe!";
      this.openPopup();
    }

    let newTeam : Team = {id: this.selectedTeamId,
      name: this.selectedTeamName,
      captainId: "",
      coachId: selectedCoachId,
      coachName: selectedCoachName,
      category: this.selectedCategoria,
      location: this.teamForm.value.location == null ? "" : this.teamForm.value.location
    }

    await this.teamBuilder.createTeam(this.ddb, newTeam);

    this.saved = true;
    this.popUpMsg = "Equipo guardado!";
    this.openPopup();

  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    if (this.saved){
      this.viewTeam(this.selectedTeamId)
    }
    this.displayStyle = "none";
  }


  @Output() callListTeam = new EventEmitter<string>();
  callParentToListTeam() {
    this.callListTeam.emit('callListTeam');
  }

  @Output() callViewTeam = new EventEmitter<string>();
  viewTeam(teamId: string){
    console.log("View team "+teamId);
    this.callViewTeam.emit(teamId)
  }
}

