import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY, SPK_KEY } from "src/app/aws-clients/dynamodb";
import { Team } from "../interfaces/team";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import {v4 as uuidv4} from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class TeamBuilder {

    constructor() {}

    async getListOfTeams(ddb: DynamoDb, category?: string | undefined): Promise<Team[]> {
        var teams: Team[] = []
        teams = await ddb.listQuery('team.data', category).then(
            (items) => {
                items.sort((a, b) => a['name'].S!.localeCompare(b['name'].S!))
                return items.map((item) => {return this.buildTeam(item)})
            }
        )

        console.log('teams', teams)
        return teams
    }

    async getTeam(ddb: DynamoDb, id: string): Promise<Team | undefined> {
        let record: Record<string, AttributeValue> = {}

        record[PK_KEY] = {S: `${id}`}
        record[SK_KEY] = {S: `team.data`}
        
        var response = await ddb.getItem(record)
        
        if(response == undefined) return

        return this.buildTeam(response);

    }

    private buildTeam(item: Record<string, AttributeValue>): Team {
        return {
            id: item['pk'].S,
            name: item['name'].S!,
            category: item['spk'].S,

        }
    }

    async addTeam(ddb: DynamoDb, name: string, category: string, players: string[]) {   

        let record: Record<string, AttributeValue> = {}
        let teamGuid = uuidv4();

        record[PK_KEY] = {S: `team.${teamGuid}`}
        record[SK_KEY] = {S: `team.data`}
        record[SPK_KEY] = {S: `${category}`}
        record['category'] = {S: `${category}`};
        record['name'] = {S: `${name}`};
        await ddb.putItem(record);

        players.forEach(async player => {
            let playerRecord: Record<string, AttributeValue> = {}
            let playerGuid = uuidv4();

            playerRecord[PK_KEY] = {S: `player.${playerGuid}`}
            playerRecord[SK_KEY] = {S: `player.data`}
            playerRecord['age'] = {S: ``};
            playerRecord['category'] = {S: `${category}`};
            playerRecord['name'] = {S: `${player}`};
            playerRecord[SPK_KEY] = {S: `team.${teamGuid}`};
            await ddb.putItem(playerRecord);
        });
    }
}