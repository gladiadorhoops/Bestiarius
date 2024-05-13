import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY } from "src/app/aws-clients/dynamodb";
import { Player, PlayerKey } from "../interfaces/player";

import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { FormBuilder, Validators } from '@angular/forms';
import { TeamKey } from '../interfaces/team';
import { CURRENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class PlayerBuilder {

    async createPlayer(ddb: DynamoDb, player: Player) {
        let playerRecord: Record<string, AttributeValue> = {}
        playerRecord[PK_KEY] = {S: `player.${player.id}`}
        playerRecord[SK_KEY] = {S: `player.data`}
        playerRecord[PlayerKey.AGE] = {S: `${player.edad}`};
        playerRecord[PlayerKey.CATEGORY] = {S: `${player.categoria}`};
        playerRecord[PlayerKey.NAME] = {S: `${player.nombre}`};
        playerRecord[SPK_KEY] = {S: `${TeamKey.PREFIX}.${player.equipo}`};
        playerRecord[CY_KEY] = {S: CURRENT_YEAR};
        await ddb.putItem(playerRecord);
    }

    async getPlayersByTeam(ddb: DynamoDb, teamId: string): Promise<Player[]> {
        let players: Player[] = []
        players = await ddb.listQuery(`${PlayerKey.PREFIX}.data`, teamId).then(
            (items) => {
                items.sort((a, b) => a[PlayerKey.NAME].S!.localeCompare(b[PlayerKey.NAME].S!))
                return items.map((item) => {return this.buildPlayer(item)})
            }
        )
        console.log('Players', players)
        return players
    }

    async getPlayer(ddb: DynamoDb, playerId: string): Promise<Player | undefined> {
        let record = {
            [PK_KEY]: {S: playerId},
            [SK_KEY]: {S: `${PlayerKey.NAME}.data`}
        }
        let item = await ddb.getItem(record)
        return item ? this.buildPlayer(item) : item
    }

    private buildPlayer(item: Record<string, AttributeValue>): Player {
        return {
            id: item['pk'].S!.split('.')[1],
            nombre: item['name'].S!,
            equipo: item['spk'].S!,
            categoria: item['category'].S!,
            edad: item['age'].S!,
            height: "",
            weight: "",
            posicion: "",
            birthday: new Date()
        }
    }

    static defaultForm = {
        scoutId: ['', Validators.required],
        scoutname: ['', Validators.required],
        nombre: ['', Validators.required],
        equipo: ['', Validators.required],
        categoria: ['', Validators.required],
        altura: [''],
        peso: [''],
        bday: [''],
        posicion: ['']
      }
}