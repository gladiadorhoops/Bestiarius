import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Gym } from "../interfaces/gym";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import {v4 as uuidv4} from 'uuid';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class GymBuilder {

    constructor(
    ) {}

    async createGym(ddb: DynamoDb, id: string, name: string, address: string, place_id: string, live_feed?: string) {
        let gymRecord: Record<string, AttributeValue> = {}
        gymRecord[PK_KEY] = {S: `gym.${id}`};
        gymRecord[SK_KEY] = {S: `gym.data`};
        gymRecord["name"] = {S: `${name}`};
        gymRecord["address"] = {S: `${address}`};
        gymRecord["place_id"] = {S: `${place_id}`};
        gymRecord["live_feed"] = {S: `${live_feed ?? ''}`};
        gymRecord[CY_KEY] = {S: TOURNAMENT_YEAR};
        await ddb.putItem(gymRecord);
    }

    // Updates an existing gym in place. The id is part of the partition key, so
    // it identifies the record and cannot itself be changed here.
    async updateGym(ddb: DynamoDb, gym: Gym) {
        let key = {
            [PK_KEY]: {S: `gym.${gym.id}`},
            [SK_KEY]: {S: `gym.data`}
        };
        let updateExpression = 'SET #name = :name, #address = :address, #place = :place, #feed = :feed';
        let expressionAttributeNames: Record<string, string> = {
            '#name': 'name',
            '#address': 'address',
            '#place': 'place_id',
            '#feed': 'live_feed',
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':name': {S: `${gym.name}`},
            ':address': {S: `${gym.address ?? ''}`},
            ':place': {S: `${gym.place_id ?? ''}`},
            ':feed': {S: `${gym.live_feed ?? ''}`},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
    }

    async getListOfGyms(ddb: DynamoDb, year?: string|undefined): Promise<Gym[]> {
        console.debug("year:", year)
        var gyms: Gym[] = []
        if(year === TOURNAMENT_YEAR){
            var items = await ddb.listByYearQuery('gym.data', TOURNAMENT_YEAR);
        }
        else{
            var items = await ddb.listQuerySKOnly('gym.data');
        }
        
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
            place_id: item['place_id'].S,
            // Gyms registered before live feeds existed have no live_feed attribute.
            live_feed: item['live_feed']?.S
        }
    }

    getEmptyGym(): Gym {
        return {
            id: "",
            name: "",
            address: "",
            place_id: "",
            live_feed: ""
        }
    }
}