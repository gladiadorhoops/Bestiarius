import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { Team } from "../interfaces/team";
import { AttributeValue } from "@aws-sdk/client-dynamodb";

@Injectable({
    providedIn: 'root'
})
export class TeamBuilder {

    constructor() {}

    async getListOfTeams(ddb: DynamoDb): Promise<Team[]> {
        var teams: Team[] = []
        teams = await ddb.listQuery('team.data').then(
            (items) => {
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
        
        return await ddb.getItem(record).then(
            async (response) => {
                if(response == undefined) return
                return this.buildTeam(response);
            }
        );

    }

    private buildTeam(item: Record<string, AttributeValue>): Team {
        return {
            id: item['pk'].S,
            name: item['name'].S!,
            category: item['category'].S,

        }
    }
}