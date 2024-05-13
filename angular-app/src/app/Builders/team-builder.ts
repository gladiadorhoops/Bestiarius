import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Team, TeamKey } from "../interfaces/team";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import {v4 as uuidv4} from 'uuid';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CURRENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class TeamBuilder {

    async createTeam(ddb: DynamoDb, team: Team) {   
        let record: Record<string, AttributeValue> = {}
        record[PK_KEY] = {S: `${TeamKey.PREFIX}.${team.id}`};
        record[SK_KEY] = {S: `${TeamKey.SK}`};
        record[SPK_KEY] = {S: `${team.category}`};
        record[SSK_KEY] = {S: `${team.coachId}`};
        record[TeamKey.NAME] = {S: `${team.name}`};
        record[TeamKey.CAPTAIN_ID] = {S: `${team.captainId}`};
        record[TeamKey.COACH_NAME] = {S: `${team.coachName}`};
        record[TeamKey.LOACTION] = {S: `${team.location}`};
        record[CY_KEY] = {S: CURRENT_YEAR};

        await ddb.putItem(record);
    }

    async getListOfTeams(ddb: DynamoDb, category?: string | undefined): Promise<Team[]> {
        var teams: Team[] = []
        teams = await ddb.listQuery(`${TeamKey.SK}`, category).then(
            (items) => {
                items.sort((a, b) => a['name'].S!.localeCompare(b['name'].S!))
                return items.map((item) => {return this.buildTeam(item)})
            }
        )

        console.log('teams', teams)
        return teams
    }

    async getTeamsByCoach(ddb: DynamoDb, coachId: string): Promise<Team[]> {
        var teams: Team[] = []
        teams = await ddb.listSecondaryQuery(`${TeamKey.SK}`, coachId).then(
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
        record[SK_KEY] = {S: `${TeamKey.SK}`}
        
        var response = await ddb.getItem(record)
        
        if(response == undefined) return

        return this.buildTeam(response);

    }

    private buildTeam(item: Record<string, AttributeValue>): Team {        
        return {
            id: item[PK_KEY].S!.split('.')[1],
            name: item[TeamKey.NAME].S!,
            category: item[SPK_KEY].S,
            captainId: item[TeamKey.CAPTAIN_ID]?.S,
            coachId: item[SSK_KEY]?.S ? item[SSK_KEY]?.S! : "",
            coachName: item[TeamKey.COACH_NAME]?.S,
            location: item[TeamKey.LOACTION]?.S,
        }
    }

    static defaultForm = {
        coachId: ['', Validators.required],
        coachName: ['', Validators.required],
        teamName: ['', Validators.required],
        category: ['', Validators.required],
        location: [''],
        captainId: ['']
      }
}