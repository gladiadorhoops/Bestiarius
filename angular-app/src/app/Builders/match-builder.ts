import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Match } from "../interfaces/match";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { TeamBuilder } from './team-builder';
import { MatchTeam } from '../interfaces/team';
import {v4 as uuidv4} from 'uuid';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';
import { GymBuilder } from './gym-builder';
import { Gym } from '../interfaces/gym';

@Injectable({
    providedIn: 'root'
})
export class MatchBuilder {

    constructor(
        private teamBuilder: TeamBuilder,
        private gymBuilder: GymBuilder
    ) {}

    
    async getListOfMatch(ddb: DynamoDb, year?: string|undefined): Promise<Match[]> {
        var matches: Match[] = []
        if(year === undefined){
            var items = await ddb.listSecondaryQuery('match.data');
        }
        else{
            var items = await ddb.listByYearQuery('match.data', year);
        }
        
        var teams = await this.teamBuilder.getTeams(ddb, year);
        var gyms = await this.gymBuilder.getListOfGyms(ddb);
        items.sort((a, b) => (a['ssk'].S!+a['time'].S!).localeCompare(b['ssk'].S!+b['time'].S!))
        for (const item of items) {
            let vteamId = item['visitorTeam'].S!.replace("team.","")
            let vteams = teams.filter(t => t.id == vteamId)
            let vteam : MatchTeam = {id: vteamId, name: " - "}
            if( vteams.length == 1){
                vteam = vteams[0]
            }
            let hteamId = item['homeTeam'].S!.replace("team.","")
            let hteams = teams.filter(t => t.id == hteamId)
            let hteam: MatchTeam = {id: hteamId, name: " - "}
            if( hteams.length == 1){
                hteam = hteams[0]
            }
            console.debug("match: ", item)
            let gym_id = item['ssk'].S!.replace("gym.","")
            console.debug("gyms: ", gyms)
            let gym = gyms.filter(g => g.id! == gym_id)[0]
            matches.push(this.buildMatch(item, vteam, hteam, gym))
        } 

        return matches
    }

    private buildMatch(item: Record<string, AttributeValue>, vteam: MatchTeam, hteam: MatchTeam, gym: Gym): Match {
        return {
            id: item[PK_KEY].S!.split('.')[1],
            category: item['category'].S,
            location: gym,
            day: item['spk'].S!,
            time: item["spk"].S!+"/07 - "+item['time'].S!,
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
                record[CY_KEY] = {S: TOURNAMENT_YEAR};
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
        record[CY_KEY] = {S: TOURNAMENT_YEAR};

        await ddb.putItem(record);
    }
}