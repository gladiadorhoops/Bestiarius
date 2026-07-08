import { Buffer } from 'buffer';
import { Component, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team, getCategories, TeamKey, PaymentStatus } from '../../interfaces/team';
import { Player, PlayerKey } from '../../interfaces/player';
import { PlayerBuilder } from '../../Builders/player-builder';
import { formatDate } from "@angular/common";
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {v4 as uuidv4} from 'uuid';
import { AddPlayerComponent } from './add-player/add-player.component';
import { Coach } from '../../interfaces/coach';
import { UserBuilder } from '../../Builders/user-builder';
import { FeatureFlag } from 'src/app/interfaces/feature-flag';
import { FeatureFlagBuilder } from 'src/app/Builders/feature-flag-builder';
import { Feature } from 'src/app/enum/feature-flag';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { S3 } from 'src/app/aws-clients/s3';


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
  displayPaymentReceipt = "none";
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
  @Input() s3!: S3;

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

  receiptFiles: {data: Buffer, contentType: string, preview: string}[] = [];
  existingReceiptUrls: string[] = [];
  loadingReceipt: boolean = false;
  paymentStatus: PaymentStatus = PaymentStatus.PENDING;

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
      this.isScout = true;
    }
    if(this.userrole == "coach"){
      this.isCoach = true;
    }
  }

  async ngOnInit() {
    this.reloadLoginStatus();

    if(this.userrole == "admin") {
      this.coaches = await this.userBuilder.getCoaches(this.ddb);
    } else if(this.userrole == "coach"){
      this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
      this.editable = this.featureFlags ? this.featureFlags.editTeams : false;
    }
    else {
      console.warn("User role not allowed to view teams: ", this.userrole)
    }
  }
  
  async loadTeam(teamId: string){
    this.loading = true;
    this.team = await this.teamBuilder.getTeam(this.ddb, teamId);
    this.players = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
    this.players = this.players.filter((p: Player) => p.year! === this.team!.year!);
    await this.getAllPlayers();
    this.checkPaymentStatus();
    this.loading = false;
  }

  private checkPaymentStatus(){
    this.paymentStatus = this.team?.paymentStatus ?? PaymentStatus.PENDING;
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

  async openPaymentReceipt(){
    this.receiptFiles = [];
    this.existingReceiptUrls = [];
    this.receiptError = "";
    this.loadingReceipt = true;
    this.displayPaymentReceipt = "block";

    if (this.team) {
      for (let i = 0; i < 10; i++) {
        const fileName = TeamBuilder.getReceiptFileName(this.team.name, this.team.id, i);
        const data = await this.s3.downloadFile(fileName, false);
        if (data) {
          const blob = new Blob([data as any]);
          this.existingReceiptUrls.push(URL.createObjectURL(blob));
        } else {
          break;
        }
      }
    }
    this.loadingReceipt = false;
  }

  closePaymentReceipt(){
    this.displayPaymentReceipt = "none";
  }

  receiptError: string = "";

  onReceiptFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        this.receiptError = "Todos los archivos deben ser imágenes.";
        return;
      }
    }

    this.receiptError = "";
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        this.receiptFiles.push({
          data: Buffer.from(reader.result as ArrayBuffer),
          contentType: file.type,
          preview: URL.createObjectURL(file)
        });
      };
    }
  }

  removeReceiptFile(index: number): void {
    this.receiptFiles.splice(index, 1);
  }

  async deleteExistingReceipt(index: number){
    if (!this.team) return;
    if (!confirm('¿Estás seguro que deseas eliminar este comprobante?')) return;

    const totalExisting = this.existingReceiptUrls.length;

    for (let i = index; i < totalExisting - 1; i++) {
      const nextFileName = TeamBuilder.getReceiptFileName(this.team.name, this.team.id, i + 1);
      const data = await this.s3.downloadFile(nextFileName, false);
      if (data) {
        const currentFileName = TeamBuilder.getReceiptFileName(this.team.name, this.team.id, i);
        await this.s3.uploadFile(currentFileName, data, 'image/jpeg');
        this.s3.invalidateCache(currentFileName);
      }
    }
    await this.teamBuilder.deletePaymentReceipt(this.s3, this.team, totalExisting - 1);

    this.existingReceiptUrls = [];
    for (let i = 0; i < totalExisting - 1; i++) {
      const fileName = TeamBuilder.getReceiptFileName(this.team.name, this.team.id, i);
      const data = await this.s3.downloadFile(fileName, false);
      if (data) {
        const blob = new Blob([data as any]);
        this.existingReceiptUrls.push(URL.createObjectURL(blob));
      } else {
        break;
      }
    }
  }

  async uploadPaymentReceipt(){
    if (this.receiptFiles.length > 0 && this.team) {
      const startIndex = this.existingReceiptUrls.length;
      await this.teamBuilder.uploadPaymentReceipts(this.ddb, this.s3, this.team, this.receiptFiles, startIndex);
      this.paymentStatus = PaymentStatus.IN_REVIEW;
      this.closePaymentReceipt();
    }
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
      location: val.location,
      paymentStatus: this.team?.paymentStatus
    }

    await this.teamBuilder.updateTeam(this.ddb, this.team);
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
    this.addPlayer()
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
    await this.addPlayerViewChild.loadPlayer(this.newplayerid);
    this.displayAddPlayer = "block"
  }
  closeAddPlayerPopup() {
    this.displayAddPlayer = "none";
    this.newplayerid = uuidv4();
  }

  @ViewChild(AddPlayerComponent) addPlayerViewChild!: AddPlayerComponent;
  async confirmAddPlayer() {
    // loads the player values from AddPlayerComponent
    this.addPlayerViewChild.getPlayerInput();
    let newPlayer = this.addPlayerViewChild.player;
    console.log("Adding Player:", newPlayer);
    await this.playerBuilder.createPlayer(this.ddb, newPlayer);
    await this.addPlayerViewChild.savePlayerPhoto();
    console.log(`Saved Player: ${newPlayer.name} - ${newPlayer.id}`);
    await this.loadTeam(this.team!.id);
    this.closeAddPlayerPopup();
  }
}
