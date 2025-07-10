import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team } from '../../interfaces/team';
import { Coach } from '../../interfaces/coach';
import { UserBuilder } from '../../Builders/user-builder';
import { TOURNAMENT_YEAR } from '../../aws-clients/constants';
import { Player } from 'src/app/interfaces/player';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { FeatureFlag } from 'src/app/interfaces/feature-flag';
import { FeatureFlagBuilder } from 'src/app/Builders/feature-flag-builder';

@Component({
  selector: 'app-list-teams',
  templateUrl: './list-teams.component.html',
  styleUrls: ['./list-teams.component.scss']
})
export class ListTeamsComponent {
    teamRenewalForm: FormGroup;
  
    constructor(private fb: FormBuilder,
      private authService: AuthService,
      private teamBuilder: TeamBuilder,
      private playerBuilder: PlayerBuilder,
      private userBuilder: UserBuilder,
      private featureFlagBuilder: FeatureFlagBuilder
    ){
      this.teamRenewalForm = this.fb.group({
        selectedOptions: new FormArray([])
      });
    }

    get ordersFormArray() {
      return this.teamRenewalForm.controls['selectedOptions'] as FormArray;
    }

    private addCheckboxes() {
      this.teamRenewalForm = this.fb.group({
        selectedOptions:  new FormArray([])
      });
      this.renewalPlayers!.forEach(() => this.ordersFormArray.push(new FormControl(false)));
    }
  
    editable = true;
    featureFlags: FeatureFlag | undefined = undefined
  
    @Input() ddb!: DynamoDb;
    loading = true;
    teams: Team[] = [];
    pastTeams: Team[] = [];
    coaches: Map<string,Coach> = new Map<string, Coach>();
    year = TOURNAMENT_YEAR;
  
    isAdmin = false;
    isScout = false;
    isCoach = false;
    userId = "";
    userrole = "";
    selectedRenewalTeam: Team | undefined
    renewalPlayers: Player[] | undefined

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

    async updateSelectedRenewalTeam(teamId: string){
      this.selectedRenewalTeam = await this.teamBuilder.getTeam(this.ddb, teamId);
      this.renewalPlayers = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
      this.addCheckboxes();
      this.openPopup();
    }

    async onSubmit() {
      // TODO: Use EventEmitter with form value

      var selectedPlayers = this.teamRenewalForm.value.selectedOptions
        .map((checked: boolean, i: number) => checked ? this.renewalPlayers![i] : null)
        .filter((p: Player | null) => p !== null);
  
      await this.userBuilder.updateCoachYear(this.ddb, this.selectedRenewalTeam!.coachId, TOURNAMENT_YEAR)
      try {
        for (let p of selectedPlayers) {
          console.log("Updating player ", p.name)
          await this.playerBuilder.updatePlayerYear(this.ddb, p, TOURNAMENT_YEAR, this.selectedRenewalTeam!.id)
        }
        await this.teamBuilder.updateTeamYear(this.ddb, this.selectedRenewalTeam!, TOURNAMENT_YEAR)
      } catch (err) {
        console.error("Error updating year")
      }
      this.refreshTeams()
      this.closePopup()
    }

    async refreshTeams(){
      this.reloadLoginStatus()
      
      if (this.userrole == "coach"){
        this.teams = await this.teamBuilder.getTeamsByCoach(this.ddb, this.userId);
      }
      else{
        this.teams = await this.teamBuilder.getTeamsAllYears(this.ddb);
      }
      this.pastTeams = this.teams.filter(t => t.year != TOURNAMENT_YEAR)
      this.teams = this.teams.filter(t => t.year === TOURNAMENT_YEAR)
      this.sortTeamsByCategory()
      let coachesList:Coach[] = await this.userBuilder.getCoaches(this.ddb);
  
      coachesList.forEach(coach => {
        this.coaches.set(coach.id, coach);
      });
    }

    async ngOnInit() {
      await this.refreshTeams();
      this.loading = false;

      this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
      this.editable = this.featureFlags ? this.featureFlags.editTeams : false;
      console.log("editable ", this.editable)
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
  
    @Output() callViewTeam = new EventEmitter<string>();
    viewTeam(teamId: string){
      console.log("View team "+teamId);
      this.callViewTeam.emit(teamId)
    }
  
    editTeam(teamId: string){
      // TODO: implement
      console.log("Edit team "+teamId);
    }
  
    removeTeam(teamId: string){
      // TODO: implement
      console.log("Remove team "+teamId);
    }
    displayStyle = "none";
    openPopup() {
      this.displayStyle = "block";
    }
    closePopup() {
      this.selectedRenewalTeam = this.teamBuilder.getEmptyTeam();
      this.renewalPlayers = [];
      this.displayStyle = "none";
    }
    errordisplayStyle = "none";
    openErrorPopup() {
      this.errordisplayStyle = "block";
    }
    closeErrorPopup() {
      this.errordisplayStyle = "none";
    }
  }
  