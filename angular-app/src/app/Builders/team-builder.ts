import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, IndexId, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Team, TeamKey } from "../interfaces/team";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import {v4 as uuidv4} from 'uuid';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';
import { CoachKey } from '../interfaces/coach';

@Injectable({
    providedIn: 'root'
})
export class TeamBuilder {

    async createTeam(ddb: DynamoDb, team: Team) {   
        let record: Record<string, AttributeValue> = {}
        record[PK_KEY] = {S: `${TeamKey.PREFIX}.${team.id}`};
        record[SK_KEY] = {S: `${TeamKey.SK}`};
        record[SPK_KEY] = {S: `${team.category}`};
        record[TeamKey.CATEGORY] = {S: `${team.category}`};
        record[SSK_KEY] = {S: `${team.coachId}`};
        record[TeamKey.NAME] = {S: `${team.name}`};
        record[TeamKey.CAPTAIN_ID] = {S: `${team.captainId}`};
        record[TeamKey.COACH_NAME] = {S: `${team.coachName}`};
        record[TeamKey.LOACTION] = {S: `${team.location}`};
        record[CY_KEY] = {S: TOURNAMENT_YEAR};
        console.log('record', record)
        
        await ddb.putItem(record);
    }

    async updateTeamYear(ddb: DynamoDb, team: Team, year: string) {

        let key = {
            [PK_KEY]: {S: `${TeamKey.PREFIX}.${team.id}`},
            [SK_KEY]: {S: `${TeamKey.SK}`}
        };
        let updateExpression = 'SET #yearattr = :val';
        let expressionAttributeNames: Record<string, string> = {
            '#yearattr': `${CY_KEY}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {S: year},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
    }



    async updateCaptainId(ddb: DynamoDb, teamId: string, captainId: string) {

        let key = {
            [PK_KEY]: {S: `${TeamKey.PREFIX}.${teamId}`},
            [SK_KEY]: {S: `${TeamKey.SK}`}
        };
        let updateExpression = 'SET #capattr = :val';
        let expressionAttributeNames: Record<string, string> = {
            '#capattr': `${TeamKey.CAPTAIN_ID}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {S: `${captainId}`},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
    }

    async getTeamsByCategory(ddb: DynamoDb, category: string, year: string = TOURNAMENT_YEAR): Promise<Team[]> {
        var teams: Team[] = []
        
        let keyConditionExpression = ddb.indexes[IndexId.LIST_GSI].keyConditionExpression(year);
        let filterExpression = '#cat = :cat';
        let expressionAttributeNames: Record<string, string> = {
            '#cat': `${TeamKey.CATEGORY}`,
        }
        let expressionAttributeValues: Record<string, AttributeValue> = {
            [`${ddb.indexes[IndexId.LIST_GSI].pkAttributeKey}`]: {S: TeamKey.SK},
            ':cat': {S: category},
            [`${ddb.indexes[IndexId.LIST_GSI].skAttributeKey}`]: {S: year}
        }
        
        teams = await ddb.query(IndexId.LIST_GSI, keyConditionExpression, expressionAttributeValues, filterExpression, expressionAttributeNames).then(
            (items) => {
                items.sort((a, b) => a[TeamKey.NAME].S!.localeCompare(b[TeamKey.NAME].S!))
                return items.map((item) => {return this.buildTeam(item)})
            }
        )
        console.log('teams', teams)
        return teams
    }

    async getTeams(ddb: DynamoDb, year: string = TOURNAMENT_YEAR): Promise<Team[]> {
        var teams: Team[] = []
        teams = await ddb.listByYearQuery(`${TeamKey.PREFIX}.data`, year).then(
            (items) => {
                items.sort((a, b) => a[TeamKey.NAME].S!.localeCompare(b[TeamKey.NAME].S!))
                return items.map((item) => {return this.buildTeam(item)})
            }
        )
        return teams
    }

    async getTeamsByCoach(ddb: DynamoDb, coachId: string): Promise<Team[]> {
        var teams: Team[] = await ddb.listSecondaryQuery(`${TeamKey.SK}`, coachId).then(
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

        record[PK_KEY] = {S: `${TeamKey.PREFIX}.${id}`}
        record[SK_KEY] = {S: `${TeamKey.SK}`}
        
        var response = await ddb.getItem(record)
        
        if(response == undefined) return

        return this.buildTeam(response);

    }

    async deleteTeam(ddb: DynamoDb, teamId: string) {
        let record: Record<string, AttributeValue> = {}
        record[PK_KEY] = {S: `${TeamKey.PREFIX}.${teamId}`};
        record[SK_KEY] = {S: `${TeamKey.SK}`};

        await ddb.deleteItem(record);
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
            year: item[TeamKey.YEAR].S ? item[TeamKey.YEAR].S : "",
        }
    }

    getEmptyTeam(): Team {
        return {
            id: "",
            name: "",
            captainId: "",
            coachId: "",
            coachName: "",
            location: ""
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