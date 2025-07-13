import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Player, PlayerKey } from "../interfaces/player";

import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Validators } from '@angular/forms';
import { TeamKey } from '../interfaces/team';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';

@Injectable({
    providedIn: 'root'
})
export class PlayerBuilder {
    async updatePlayerImageType(ddb: DynamoDb, playerId: string, type: string) {
        let key = {
            [PK_KEY]: {S: `${PlayerKey.PREFIX}.${playerId}`},
            [SK_KEY]: {S: `${PlayerKey.PREFIX}.data`}
        };
        let updateExpression = 'SET #imgattr = :val';
        let expressionAttributeNames: Record<string, string> = {
            '#imgattr': `${PlayerKey.IMAGE_TYPE}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {S: type},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
    }

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
        playerRecord[PlayerKey.IMAGE_TYPE] = {S: `${player.imageType}`};
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

    async getAllPlayers(ddb: DynamoDb): Promise<Player[]> {
        let players: Player[] = []
        players = await ddb.listByYearQuery(`${PlayerKey.PREFIX}.data`, TOURNAMENT_YEAR).then(
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
            birthday: item[PlayerKey.BIRTHDAY].S ? new Date(item[PlayerKey.BIRTHDAY].S) : undefined,
            imageType: item[PlayerKey.IMAGE_TYPE] ? item[PlayerKey.IMAGE_TYPE].S : undefined,
            year: item[CY_KEY].S ? item[CY_KEY].S : ""
        }
    }

    async updatePlayerYear(ddb: DynamoDb, playerId: string, year: string, teamId: string, cat: string) {

        let key = {
            [PK_KEY]: {S: `${PlayerKey.PREFIX}.${playerId}`},
            [SK_KEY]: {S: `${PlayerKey.PREFIX}.data`}
        };
        let updateExpression = 'SET #yearattr = :val, #teamattr = :val2, #catattr = :val3';
        let expressionAttributeNames: Record<string, string> = {
            '#yearattr': `${CY_KEY}`,
            '#teamattr': `${SPK_KEY}`,
            '#catattr': `${PlayerKey.CATEGORY}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {S: year},
            ':val2': {S: `${TeamKey.PREFIX}.${teamId}`},
            ':val3': {S: `${cat}`},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
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