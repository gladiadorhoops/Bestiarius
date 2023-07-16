import { DynamoDb } from "src/app/aws-clients/dynamodb";
import { Team } from "../interfaces/team";
import { AttributeValue } from "@aws-sdk/client-dynamodb";

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

    private buildTeam(item: Record<string, AttributeValue>): Team {
        return {
            id: item['pk'].S,
            name: item['name'].S!,
            category: item['category'].S,

        }
    }
}