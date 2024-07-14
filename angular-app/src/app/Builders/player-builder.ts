import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY } from "src/app/aws-clients/dynamodb";
import { Player, PlayerKey } from "../interfaces/player";

import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Validators } from '@angular/forms';
import { TeamKey } from '../interfaces/team';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class PlayerBuilder {

    async createPlayer(ddb: DynamoDb, player: Player) {
        let playerRecord: Record<string, AttributeValue> = {}
        playerRecord[PK_KEY] = {S: `${PlayerKey.PREFIX}.${player.id}`}
        playerRecord[SK_KEY] = {S: `${PlayerKey.PREFIX}.data`}
        playerRecord[SPK_KEY] = {S: `${TeamKey.PREFIX}.${player.team}`};
        playerRecord[PlayerKey.AGE] = {S: `${player.age}`};
        playerRecord[PlayerKey.CATEGORY] = {S: `${player.category}`};
        playerRecord[PlayerKey.NAME] = {S: `${player.name}`};
        playerRecord[PlayerKey.HEIGHT] = {S: `${player.height}`};
        playerRecord[PlayerKey.WEIGHT] = {S: `${player.weight}`};
        playerRecord[PlayerKey.POSITION] = {S: `${player.position}`};
        playerRecord[CY_KEY] = {S: TOURNAMENT_YEAR};
        if(player.birthday) playerRecord[PlayerKey.BIRTHDAY] = {S: `${player.birthday?.toDateString()}`};
        await ddb.putItem(playerRecord);
    }

    async getPlayersByTeam(ddb: DynamoDb, teamId: string): Promise<Player[]> {
        let players: Player[] = []
        players = await ddb.listQuery(`${PlayerKey.PREFIX}.data`, `${TeamKey.PREFIX}.${teamId}`).then(
            (items) => {
                items.sort((a, b) => a[PlayerKey.NAME].S!.localeCompare(b[PlayerKey.NAME].S!))
                return items.map((item) => {return this.buildPlayer(item)})
            }
        )
        console.log('Players', players)
        return players
    }

    async deletePlayersByTeam(ddb: DynamoDb, teamId: string) {
        let players: Player[] = await this.getPlayersByTeam(ddb, teamId)
        console.log('Players to delete', players)
        
        players.forEach(
            (player) => { this.deletePlayer(ddb, player.id) }
        )
        return players
    }

    async getPlayer(ddb: DynamoDb, playerId: string): Promise<Player | undefined> {
        let record = {
            [PK_KEY]: {S: `${PlayerKey.PREFIX}.${playerId}`},
            [SK_KEY]: {S: `${PlayerKey.PREFIX}.data`}
        }
        let item = await ddb.getItem(record);
        return item ? this.buildPlayer(item) : item;
    }

    async deletePlayer(ddb: DynamoDb, playerId: string) {
        let record = {
            [PK_KEY]: {S: `${PlayerKey.PREFIX}.${playerId}`},
            [SK_KEY]: {S: `${PlayerKey.PREFIX}.data`}
        }
        await ddb.deleteItem(record);
    }

    private buildPlayer(item: Record<string, AttributeValue>): Player {
        return {
            id: item[PK_KEY].S!.split('.')[1],
            team: item[SPK_KEY].S!.split('.')[1],
            name: item[PlayerKey.NAME].S!,
            category: item[PlayerKey.CATEGORY].S!,
            age: item[PlayerKey.AGE].S ? item[PlayerKey.AGE].S : "",
            height: item[PlayerKey.HEIGHT].S ? item[PlayerKey.HEIGHT].S : "",
            weight: item[PlayerKey.WEIGHT].S ? item[PlayerKey.WEIGHT].S : "",
            position: item[PlayerKey.POSITION].S ? item[PlayerKey.POSITION].S : "",
            birthday: item[PlayerKey.BIRTHDAY].S ? new Date(item[PlayerKey.BIRTHDAY].S) : undefined
        }
    }



    getEmptyPlayer(): Player {
        return {
            id: "",
            team: "",
            name: "",
            category: "",
            age: "",
            height: "",
            weight: "",
            position: "",
            birthday: new Date("Tue Mar 05 2013")
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