import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { Match } from "../interfaces/match";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { TeamBuilder } from './team-builder';
import { Team } from '../interfaces/team';

@Injectable({
    providedIn: 'root'
})
export class MatchBuilder {

    constructor(
        private teamBuilder: TeamBuilder
    ) {}

    
    async getListOfMatch(ddb: DynamoDb): Promise<Match[]> {
        var matches: Match[] = []
        var items = await ddb.listQuery('match.data')
        for (const item of items) {
            let vteamId = item['visitorTeam'].S!
            let vteam = await this.teamBuilder.getTeam(ddb, vteamId)
            if( vteam == undefined){
                vteam = {id: vteamId, name: " - "}
            }
            let hteamId = item['homeTeam'].S!
            let hteam = await this.teamBuilder.getTeam(ddb, hteamId)
            if( hteam == undefined){
                hteam = {id: hteamId, name: " - "}
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
}