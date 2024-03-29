import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Match } from "../interfaces/match";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { TeamBuilder } from './team-builder';
import { Team } from '../interfaces/team';
import {v4 as uuidv4} from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class MatchBuilder {

    constructor(
        private teamBuilder: TeamBuilder
    ) {}

    
    async getListOfMatch(ddb: DynamoDb): Promise<Match[]> {
        var matches: Match[] = []
        var items = await ddb.listQuery('match.data');
        items.sort((a, b) => a['time'].S!.localeCompare(b['time'].S!))
        var teams = await this.teamBuilder.getListOfTeams(ddb);
        for (const item of items) {
            let vteamId = item['visitorTeam'].S!
            let vteams = teams.filter(t => t.id == vteamId)
            let vteam : Team = {id: vteamId, name: " - "}
            if( vteams.length == 1){
                vteam = vteams[0]
            }
            let hteamId = item['homeTeam'].S!
            let hteams = teams.filter(t => t.id == hteamId)
            let hteam: Team = {id: hteamId, name: " - "}
            if( hteams.length == 1){
                hteam = hteams[0]
            }
            matches.push(this.buildMatch(item, vteam, hteam))
        } 

        return matches
    }

    private buildMatch(item: Record<string, AttributeValue>, vteam: Team, hteam: Team): Match {
        return {
            id: item['pk'].S,
            category: item['category'].S,
            location: item['ssk'].S!,
            day: item['spk'].S!,
            time: item['time'].S!,
            juego: item['juego'].S!,
            visitorPoints: item['visitorPoints'].S!,
            homePoints: item['homePoints'].S!,
            braketPlace: item['braketPlace'].S!,
            visitorTeam: vteam,
            homeTeam: hteam
        }
    }

    async submit(ddb: DynamoDb, id: string, homePoints: string, visitorPoints: string) {   

        let record: Record<string, AttributeValue> = {}

        record[PK_KEY] = {S: `${id}`}
        record[SK_KEY] = {S: `match.data`}
        
        
        return await ddb.getItem(record).then(
            async (response) => {
                console.warn("response record")
                
                let record: Record<string, AttributeValue> = {}
                if(response){
                    record = response
                }
                record['homePoints'] = {S: `${homePoints}`};
                record['visitorPoints'] = {S: `${visitorPoints}`};
                console.warn(record)
                
                return await ddb.putItem(record).then(
                    (rs) => {
                        console.log(`Match score updated`)
                        return rs;
                    }
                );
            }
        )
    }

    async EditTeams(ddb: DynamoDb, id: string, homeTeam: string, visitorTeam: string) {   

        let record: Record<string, AttributeValue> = {}

        record[PK_KEY] = {S: `${id}`}
        record[SK_KEY] = {S: `match.data`}
        
        
        return await ddb.getItem(record).then(
            async (response) => {
                console.warn("response record")
                
                let record: Record<string, AttributeValue> = {}
                if(response){
                    record = response
                }
                record['homeTeam'] = {S: `${homeTeam}`};
                record['visitorTeam'] = {S: `${visitorTeam}`};
                console.warn(record)
                
                return await ddb.putItem(record).then(
                    (rs) => {
                        console.log(`Match teams updated`)
                        return rs;
                    }
                );
            }
        )
    }

    async addEpmtyMatch(ddb: DynamoDb, category: string, juego: string, bracket: string, homeTeam?: string, visitorTeam?: string, day?: string, time?: string, gym?: string) {   
    
        let record: Record<string, AttributeValue> = {}
        let matchGuid = uuidv4();

        record[PK_KEY] = {S: `match.${matchGuid}`}
        record[SK_KEY] = {S: `match.data`}
        record[SPK_KEY] = {S: `${day}`}
        record[SSK_KEY] = {S: `${gym}`}
        record['category'] = {S: `${category}`};
        record['homeTeam'] = {S: `${homeTeam}`};
        record['visitorTeam'] = {S: `${visitorTeam}`};
        record['homePoints'] = {S: `0`};
        record['visitorPoints'] = {S: `0`};
        record['time'] = {S: `${time}`};
        record['juego'] = {S: `${juego}`};
        record['braketPlace'] = {S: `${bracket}`};

        await ddb.putItem(record);
    }
}