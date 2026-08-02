import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { GymBuilder } from 'src/app/Builders/gym-builder';
import { Gym } from 'src/app/interfaces/gym';
import { DynamoDb } from '../../aws-clients/dynamodb';

@Component({
  selector: 'app-add-gym',
  templateUrl: './add-gym.component.html',
  styleUrls: ['./add-gym.component.scss']
})
export class AddGymComponent implements OnInit {
  @Input() ddb!: DynamoDb;

  constructor(private fb: FormBuilder, 
    private gymBuilder: GymBuilder,
    ) {
  }

  async ngOnInit() {
    await this.loadGyms()
    this.isLoading = false;
  }

  gymForm = this.fb.group({
    id: [''],
    name: [''],
    address: [''],
    place_id: [''],
    live_feed: ['']
  });

  isLoading = true;
  gyms : Gym[] = [];
  displayStyle = "none";
  popUpMsg = "";

  // The form lives in a modal that serves both registering a new gym and editing
  // an existing one. editingGym is non-null only in the latter case, where the id
  // is fixed since it's part of the key.
  displayGymForm = "none";
  editingGym: Gym | null = null;

  async loadGyms() {
    this.gyms = []
    let gyms = await this.gymBuilder.getListOfGyms(this.ddb, TOURNAMENT_YEAR).then(
      (output) => {
        return output
      }
    )
    this.gyms = this.gyms.concat(gyms);
  }

  async onSubmit(){
    if(this.editingGym) {
      await this.saveEdit();
      return;
    }

    try {
      if(this.gyms.find(g => g.id == this.gymForm.value.id!)){
        throw "Gym id already exists!"
      }
      await this.gymBuilder.createGym(this.ddb, this.gymForm.value.id!, this.gymForm.value.name!, this.gymForm.value.address!, this.gymForm.value.place_id!, this.gymForm.value.live_feed ?? undefined)
      console.warn ('Saved sucessfully!')
      this.closeGymForm();
      await this.loadGyms();
      this.popUpMsg = "Gimnasio Registrado!";
      this.openPopup();

    } catch (err) {
      console.error("Error creating gym")
      this.popUpMsg = "Error! Gimnasio no registrado. Intenta otra vez.";
      this.openPopup();
    }
  }

  // Opens the modal with an empty form to register a new gym.
  addGym() {
    this.editingGym = null;
    this.gymForm.reset();
    this.displayGymForm = "block";
  }

  // Opens the modal with this gym's values loaded, so its fields become editable.
  edit(gym: Gym) {
    this.editingGym = gym;
    this.gymForm.patchValue({
      id: gym.id,
      name: gym.name,
      address: gym.address ?? '',
      place_id: gym.place_id ?? '',
      live_feed: gym.live_feed ?? ''
    });
    this.displayGymForm = "block";
  }

  closeGymForm() {
    this.displayGymForm = "none";
    this.editingGym = null;
    this.gymForm.reset();
  }

  private async saveEdit() {
    try {
      let updated: Gym = {
        id: this.editingGym!.id,
        name: this.gymForm.value.name!,
        address: this.gymForm.value.address ?? '',
        place_id: this.gymForm.value.place_id ?? '',
        live_feed: this.gymForm.value.live_feed ?? ''
      };
      await this.gymBuilder.updateGym(this.ddb, updated);
      this.closeGymForm();
      await this.loadGyms();
      this.popUpMsg = "Gimnasio Actualizado!";
      this.openPopup();
    } catch (err) {
      console.error("Error updating gym", err)
      this.popUpMsg = "Error! Gimnasio no actualizado. Intenta otra vez.";
      this.openPopup();
    }
  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}
