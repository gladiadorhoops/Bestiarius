import { Injectable } from '@angular/core';
import { DynamoDb } from "src/app/aws-clients/dynamodb";
import { Player } from "../interfaces/player";

import { AttributeValue } from "@aws-sdk/client-dynamodb";

@Injectable({
    providedIn: 'root'
})
export class PlayerBuilder {

    constructor() {}

    async getPlayersByTeam(ddb: DynamoDb, teamId: string): Promise<Player[]> {
        let players: Player[] = []
        players = await ddb.listQuery('player.data', teamId).then(
            (items) => {
                items.sort((a, b) => a['name'].S!.localeCompare(b['name'].S!))
                return items.map((item) => {return this.buildPlayer(item)})
            }
        )
        console.log('Players', players)
        return players
    }

    private buildPlayer(item: Record<string, AttributeValue>): Player {
        return {
            id: item['pk'].S!,
            nombre: item['name'].S!,
            equipo: item['spk'].S!,
            categoria: item['category'].S!,
            edad: item['age'].S!
        }
    }
}