import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Award } from "../interfaces/award";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { TeamBuilder } from './team-builder';
import { MatchTeam } from '../interfaces/team';
import {v4 as uuidv4} from 'uuid';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class AwardBuilder {

    constructor(
    ) {}

    
    async getListOfAwards(ddb: DynamoDb, year?: string|undefined): Promise<Award[]> {
        var awards: Award[] = []
        if(year === undefined){
            var items = await ddb.listSecondaryQuery('award.data');
        }
        else{
            var items = await ddb.listByYearQuery('award.data', year);
        }
        
        items.sort((a, b) => a['time'].S!.localeCompare(b['time'].S!))
        for (const item of items) {
            awards.push(this.buildAward(item))
        } 

        return awards;
    }

    private buildAward(item: Record<string, AttributeValue>): Award {
        return {
            id: item[PK_KEY].S!.split('.')[1],
            category: item['category'].S,
            type: item['type'].S,
            meaning: item['meaning'].S,
            winners: item['winners'].S!.split(',')
        }
    }
}