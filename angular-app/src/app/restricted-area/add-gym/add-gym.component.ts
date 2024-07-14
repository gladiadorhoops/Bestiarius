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
    id: null,
    name: null,
    address: null,
    place_id: null
  });

  isLoading = true;
  gyms : Gym[] = [];
  displayStyle = "none";
  popUpMsg = "";

  async loadGyms() {
    this.gyms = []
    let gyms = await this.gymBuilder.getListOfGyms(this.ddb).then(
      (output) => {
        return output
      }
    )
    this.gyms = this.gyms.concat(gyms);
  }

  async onSubmit(){
    try {
      if(this.gyms.find(g => g.id == this.gymForm.value.id!)){
        throw "Gym id already exists!"
      }
      await this.gymBuilder.createGym(this.ddb, this.gymForm.value.id!, this.gymForm.value.name!, this.gymForm.value.address!, this.gymForm.value.place_id!)
      console.warn ('Saved sucessfully!')
      this.popUpMsg = "Gimnasio Registrado!";
      this.openPopup();
      this.gymForm.reset();

    } catch (err) {
      console.error("Error creating gym")
      this.popUpMsg = "Error! Gimnasio no registrado. Intenta otra vez.";
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
