import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team, getCategories, TeamKey } from '../../interfaces/team';
import { Player, PlayerKey } from '../../interfaces/player';
import { PlayerBuilder } from '../../Builders/player-builder';
import { formatDate } from "@angular/common";
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {v4 as uuidv4} from 'uuid';
import { AddPlayerComponent } from '../add-team/add-player/add-player.component';
import { Coach } from '../../interfaces/coach';
import { UserBuilder } from '../../Builders/user-builder';
import { FeatureFlag } from 'src/app/interfaces/feature-flag';
import { FeatureFlagBuilder } from 'src/app/Builders/feature-flag-builder';
import { Feature } from 'src/app/enum/feature-flag';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';

@Component({
  selector: 'app-view-teams',
  templateUrl: './view-teams.component.html',
  styleUrls: ['./view-teams.component.scss']
})
export class ViewTeamsComponent {

  displayConfirmDeletePlayer = "none";
  displayConfirmDeleteTeam = "none";
  displayAddPlayer = "none";
  displayCaptan = "none";
  displayEditTeam = "none";
  displayAddExistingPlayer = "none";
  addExistingPlayerForm: FormGroup;

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private userBuilder: UserBuilder,
    private playerBuilder: PlayerBuilder,
    private featureFlagBuilder: FeatureFlagBuilder
  ){
    this.selectedPlayer=this.playerBuilder.getEmptyPlayer();
    this.addExistingPlayerForm = this.fb.group({
      selectedOptions: new FormArray([])
    });
  }

  @Input() ddb!: DynamoDb;

  loading = true;
  team: Team | undefined;
  players: Player[] = [];
  availablePlayers: Player[] = []
  coaches: Coach[] = [];
  categories = getCategories();
  deleteForm : FormGroup = this.fb.group({teamToDelete: ''});
  deletePlayerForm : FormGroup = this.fb.group({playerToDelete: ''});
  editForm : FormGroup = this.fb.group({coachId: '', category: '', teamName: '', location: '', captainId: ''});
  selectedPlayer: Player;

  errorMsg = "";
  isAdmin = false;
  isScout = false;
  isCoach = false;
  userId = "";
  userrole = "";
  newplayerid = uuidv4();
  featureFlags: FeatureFlag | undefined = undefined
  selectedCaptain:string = "";

  editable = true;

  get ordersFormArray() {
    return this.addExistingPlayerForm.controls['selectedOptions'] as FormArray;
  }

  private addCheckboxes() {
    this.addExistingPlayerForm = this.fb.group({
      selectedOptions:  new FormArray([])
    });
    this.availablePlayers!.forEach(() => this.ordersFormArray.push(new FormControl(false)));
  }
  
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
    if(this.userrole != "coach"){
      this.coaches = await this.userBuilder.getCoaches(this.ddb);
    }

    this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
    this.editable = this.featureFlags ? this.featureFlags.editTeams : false;
    
    this.reloadLoginStatus();
  }
  
  async loadTeam(teamId: string){
    this.loading = true;
    this.team = await this.teamBuilder.getTeam(this.ddb, teamId);
    this.players = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
    this.players = this.players.filter((p: Player) => p.year! === this.team!.year!);
    await this.getAllPlayers();
    this.loading = false;
  }

  @Output() callListTeam = new EventEmitter<string>();

  callParentToListTeams() {
    this.callListTeam.emit('callListTeam');
  }

  removeTeam(){
    this.displayConfirmDeleteTeam = "block";
  }

  closePopup() {
    this.displayConfirmDeleteTeam = "none";
    this.errorMsg = "";
    this.deleteForm.get("teamToDelete")?.reset();
  }
  async confirmDeleteTeam() {
    if(this.team!.name == this.deleteForm.value.teamToDelete ){
      await this.playerBuilder.deletePlayersByTeam(this.ddb, this.team!.id);
      await this.teamBuilder.deleteTeam(this.ddb, this.team!.id);
      this.displayConfirmDeleteTeam = "none";
      this.errorMsg = "";
      this.callParentToListTeams();
    }
    else{
      this.errorMsg = "Nombre del equipo no coincide!";
    }
  }

  async saveCaptan(){
    console.log("captan: ", this.selectedCaptain)
    await this.teamBuilder.updateCaptainId(this.ddb, this.team?.id!, this.selectedCaptain)
    await this.loadTeam(this.team?.id!);
    
    this.displayCaptan = "none"
  }

  onChangeCapt(value:string): void {
		this.selectedCaptain = value;
	}

  selectCaptan(){
		this.selectedCaptain = "";
    this.displayCaptan = "block"
  }

  closeCaptan(){
    this.displayCaptan = "none";
  }

  openEditTeam(){
    //category: '', teamName: '', location: '', captainId: ''});
    this.editForm.get('coachId')?.setValue(this.team!.coachId);
    this.editForm.get('category')?.setValue(this.team!.category);
    this.editForm.get('teamName')?.setValue(this.team!.name);
    this.editForm.get('location')?.setValue(this.team!.location);
    this.editForm.get('captainId')?.setValue(this.team!.captainId);
    this.displayEditTeam = "block";
  }

  closeEditPopup(){
    this.displayEditTeam = "none";
  }

  async confirmEditTeam(){
    let val = this.editForm.value;

    this.team = {id: this.team?.id!,
      name: val.teamName,
      captainId: val.captainId,
      coachId: val.coachId,
      coachName: this.coaches.filter((c)=>c.id === val.coachId)[0].name,
      category: val.category,
      location: val.location
    }

    await this.teamBuilder.createTeam(this.ddb, this.team);
    await this.loadTeam(this.team?.id);
    this.displayEditTeam = "none";
  }

  getDate(birthday: Date){
    return formatDate(birthday, 'dd/MM/yyyy', 'en-US')
  }


  async editPlayer(playerId: string) {
    console.log("View player "+playerId);
    this.selectedPlayer = (this.players.filter((p)=>p.id === playerId))[0];
    this.newplayerid = this.selectedPlayer.id;
    await this.viewChildren.forEach(element => {
      element.loadPlayer(this.newplayerid);
    });
    this.addPlayer();
  }

  deletePlayer(){
    this.displayConfirmDeletePlayer = "block"
  }
  closeDeletePlayerPopup() {
    this.displayConfirmDeletePlayer = "none";
    this.errorMsg = "";
    this.deletePlayerForm.get("playerToDelete")?.reset();
  }
  async confirmDeletePlayer() {
    if(this.selectedPlayer!.name == this.deletePlayerForm.value.playerToDelete ){
      await this.playerBuilder.deletePlayer(this.ddb, this.selectedPlayer!.id);
      this.displayConfirmDeletePlayer = "none";
      this.errorMsg = "";
      this.loadTeam(this.team!.id);
      this.closeAddPlayerPopup();
    }
    else{
      this.errorMsg = "Nombre del jugador no coincide!";
    }
  }

  async getAllPlayers(){
    let teams = await this.teamBuilder.getTeamsByCoach(this.ddb, this.team!.coachId);

    this.availablePlayers = []
    teams.forEach(async element => {
      let teamPlayers = (await this.playerBuilder.getPlayersByTeam(this.ddb, element.id)).filter(p => !(element.id === this.team?.id && p.year === TOURNAMENT_YEAR))
      this.availablePlayers.push(...teamPlayers)
    });
  }

  closeAddExistingPlayer(){
    this.displayAddExistingPlayer = "none"
  }

  addExistingPlayer(){
    this.displayAddExistingPlayer = "block"
    this.addCheckboxes();
  }
  
  async addExistingPlayerSubmit() {

    var selectedPlayers = this.addExistingPlayerForm.value.selectedOptions
      .map((checked: boolean, i: number) => checked ? this.availablePlayers![i] : null)
      .filter((p: Player | null) => p !== null);

    try {
      for (let p of selectedPlayers) {
        console.log("Updating player ", p.name)
        await this.playerBuilder.updatePlayerYear(this.ddb, p.id, TOURNAMENT_YEAR, this.team!.id, this.team!.category!)
      }
    } catch (err) {
      console.error("Error updating year")
    }
    
    await this.loadTeam(this.team?.id!);
    this.closeAddExistingPlayer();
  }
  async removePlayer(playerId: string){
    await this.playerBuilder.updatePlayerYear(this.ddb, playerId, "removed", this.team!.id, this.team!.category!)
    
    await this.loadTeam(this.team?.id!);
  }

  async addPlayer(){
    await this.viewChildren.forEach(element => {
      element.loadPlayer(this.newplayerid);
    });
    this.displayAddPlayer = "block"
  }
  closeAddPlayerPopup() {
    this.displayAddPlayer = "none";
    this.newplayerid = uuidv4();
  }

  @ViewChildren(AddPlayerComponent) viewChildren!: QueryList<AddPlayerComponent>;
  async getInputPlayer(){
    let newPlayer: Player = this.playerBuilder.getEmptyPlayer();
    await this.viewChildren.forEach(element => {
      element.savePlayer();
      console.log("updated player:");
      console.log(element.player);
      newPlayer = element.player;
    });
    return newPlayer;
  }

  async confirmAddPlayer() {
    let newPlayer = await this.getInputPlayer()
    this.playerBuilder.createPlayer(this.ddb, newPlayer).then(()=> {
      console.log("Saved "+newPlayer.name);
    });
    this.loadTeam(this.team!.id);
    this.newplayerid = uuidv4();
    this.displayAddPlayer = "none";
  }
}
