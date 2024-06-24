import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Gym } from "../interfaces/gym";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import {v4 as uuidv4} from 'uuid';
import { CURRENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class GymBuilder {

    constructor(
    ) {}

    async createGym(ddb: DynamoDb, id: string, name: string, address: string, place_id: string) {
        let gymRecord: Record<string, AttributeValue> = {}
        gymRecord[PK_KEY] = {S: `gym.${id}`};
        gymRecord[SK_KEY] = {S: `gym.data`};
        gymRecord["name"] = {S: `${name}`};
        gymRecord["address"] = {S: `${address}`};
        gymRecord["place_id"] = {S: `${place_id}`};
        gymRecord[CY_KEY] = {S: CURRENT_YEAR};
        await ddb.putItem(gymRecord);
    }
    
    async getListOfGyms(ddb: DynamoDb, year?: string|undefined): Promise<Gym[]> {
        console.debug("year:", year)
        var gyms: Gym[] = []
        var items = await ddb.listByYearQuery('gym.data', CURRENT_YEAR);
        
        console.debug("all gyms:", items)
        for (const item of items) {
            gyms.push(this.buildGym(item))
        } 
        console.debug("built gyms:", gyms)

        return gyms;
    }

    private buildGym(item: Record<string, AttributeValue>): Gym {
        return {
            id: item[PK_KEY].S!.split('.')[1],
            name: item['name'].S!,
            address: item['address'].S,
            place_id: item['place_id'].S
        }
    }

    getEmptyGym(): Gym {
        return {
            id: "",
            name: "",
            address: "",
            place_id: ""
        }
    }
}