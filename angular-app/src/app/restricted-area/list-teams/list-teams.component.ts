import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { S3 } from '../../aws-clients/s3';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team, PaymentStatus } from '../../interfaces/team';
import { Coach } from '../../interfaces/coach';
import { UserBuilder } from '../../Builders/user-builder';
import { TOURNAMENT_YEAR } from '../../aws-clients/constants';
import { Player } from 'src/app/interfaces/player';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { FeatureFlag } from 'src/app/interfaces/feature-flag';
import { FeatureFlagBuilder } from 'src/app/Builders/feature-flag-builder';
import * as QRCode from 'qrcode';

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
    @Input() s3!: S3;
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
    // Team logo URLs keyed by team id (falls back to the gray default logo).
    teamLogos: Map<string, string | ArrayBuffer | null | undefined> = new Map();

    // Blank liability-waiver template distribution (download + link + QR code).
    // The waiver is the same for every team, so it lives on the teams list.
    displayWaiverTemplate = "none";
    loadingWaiverTemplate = false;
    waiverTemplateError = "";
    waiverTemplateShareUrl: string | undefined;
    waiverTemplateQrUrl: string | undefined;
    waiverTemplateFile: {data: Uint8Array, contentType: string} | undefined;
    copiedWaiverLink = false;

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
          await this.playerBuilder.updatePlayerYear(this.ddb, p.id, TOURNAMENT_YEAR, this.selectedRenewalTeam!.id, this.selectedRenewalTeam!.category!)
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

      this.loadTeamLogos();
    }

    // Load each current team's logo from S3 into the teamLogos map so the list
    // can show a small logo before the team name.
    loadTeamLogos(){
      this.teams.forEach(team => {
        if (!this.teamLogos.has(team.id)) {
          this.teamLogos.set(team.id, "assets/logo_gray.png");
        }
        if (team.imageType) {
          this.s3.downloadFile(TeamBuilder.getLogoFilePath(team.id)).then(data => {
            if (data) {
              const blob = new Blob([data], { type: team.imageType });
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onload = () => this.teamLogos.set(team.id, reader.result);
            }
          });
        }
      });
    }

    teamLogo(teamId: string): string | ArrayBuffer | null | undefined {
      return this.teamLogos.get(teamId) ?? "assets/logo_gray.png";
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
    displayPaymentReview = "none";
    reviewTeam: Team | undefined;
    reviewReceiptUrls: string[] = [];
    loadingReviewReceipt = false;

    async openPaymentReview(team: Team, event: Event){
      event.stopPropagation();
      this.reviewTeam = team;
      this.reviewReceiptUrls = [];
      this.loadingReviewReceipt = true;
      this.displayPaymentReview = "block";

      for (let i = 0; i < 10; i++) {
        const fileName = TeamBuilder.getReceiptFileName(team.name, team.id, i);
        const data = await this.s3.downloadFile(fileName);
        if (data) {
          const blob = new Blob([data as any]);
          this.reviewReceiptUrls.push(URL.createObjectURL(blob));
        } else {
          break;
        }
      }
      this.loadingReviewReceipt = false;
    }

    closePaymentReview(){
      this.displayPaymentReview = "none";
    }

    async approvePayment(){
      if (this.reviewTeam) {
        await this.teamBuilder.updatePaymentStatus(this.ddb, this.reviewTeam.id, PaymentStatus.APPROVED);
        this.reviewTeam.paymentStatus = PaymentStatus.APPROVED;
        this.closePaymentReview();
      }
    }

    /**
     * Open the liability-waiver distribution modal: verify this year's blank
     * template is available and build a shareable public link + QR code. The
     * file is NOT downloaded automatically — the coach downloads it via the
     * "Descargar" button. Shows an unavailable message when it's missing.
     */
    async openWaiverTemplate(){
      this.waiverTemplateError = "";
      this.waiverTemplateShareUrl = undefined;
      this.waiverTemplateQrUrl = undefined;
      this.waiverTemplateFile = undefined;
      this.copiedWaiverLink = false;
      this.loadingWaiverTemplate = true;
      this.displayWaiverTemplate = "block";

      const result = await this.s3.downloadLiabilityWaiverTemplate();
      if (!result) {
        this.waiverTemplateError = "Carta responsiva no esta disponible todavia intente mas tarde";
        this.loadingWaiverTemplate = false;
        return;
      }

      // Keep the bytes so the download only happens when the coach clicks.
      this.waiverTemplateFile = result;

      // Public link + QR code so coaches can distribute the template.
      const shareUrl = this.s3.getLiabilityWaiverTemplateUrl();
      this.waiverTemplateShareUrl = shareUrl;
      try {
        this.waiverTemplateQrUrl = await QRCode.toDataURL(shareUrl, {width: 240, margin: 1});
      } catch (err) {
        console.error('Error generating QR code for waiver template:', err);
      }

      this.loadingWaiverTemplate = false;
    }

    downloadWaiverTemplate(){
      if (!this.waiverTemplateFile) return;

      const blob = new Blob([this.waiverTemplateFile.data as any], {type: this.waiverTemplateFile.contentType});
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `carta-responsiva-${this.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    }

    closeWaiverTemplate(){
      this.displayWaiverTemplate = "none";
    }

    async copyWaiverLink(){
      if (!this.waiverTemplateShareUrl) return;
      try {
        await navigator.clipboard.writeText(this.waiverTemplateShareUrl);
        this.copiedWaiverLink = true;
      } catch (err) {
        console.error('Error copying waiver link:', err);
      }
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
  