import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY, SPK_KEY, SSK_KEY } from "src/app/aws-clients/dynamodb";
import { Player, PlayerKey } from "../interfaces/player";

import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Validators } from '@angular/forms';
import { TeamKey } from '../interfaces/team';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';
import { S3, LIABILITY_WAIVER_PATH } from '../aws-clients/s3';

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

    async updatePlayerNumber(ddb: DynamoDb, playerId: string, number: string) {
        let key = {
            [PK_KEY]: {S: `${PlayerKey.PREFIX}.${playerId}`},
            [SK_KEY]: {S: `${PlayerKey.PREFIX}.data`}
        };
        let updateExpression = 'SET #numattr = :val';
        let expressionAttributeNames: Record<string, string> = {
            '#numattr': `${PlayerKey.NUMBER}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {S: number},
        };

        await ddb.updateItem(key, updateExpression, expressionAttributeNames, expressionAttributeValues);
    }

    static getLiabilityWaiverFileName(playerId: string): string {
        return `liability-waiver-${playerId}`;
    }

    // Fetch a player's signed waiver from S3 as an object URL so it can be shown
    // in a viewer. Shared by the player tables so both behave identically.
    // Returns undefined when there is no waiver or it cannot be fetched.
    async loadLiabilityWaiver(s3: S3, player: Player): Promise<{url: string, isPdf: boolean} | undefined> {
        if (!player.liabilityWaiver) {
            return undefined;
        }

        const result = await s3.downloadFileWithType(player.liabilityWaiver, LIABILITY_WAIVER_PATH);
        if (!result) {
            return undefined;
        }

        const blob = new Blob([result.data as BlobPart], {type: result.contentType});
        return {
            url: URL.createObjectURL(blob),
            isPdf: result.contentType === 'application/pdf'
        };
    }

    async uploadLiabilityWaiver(ddb: DynamoDb, s3: S3, playerId: string, data: Buffer | Uint8Array, contentType: string): Promise<void> {
        const fileName = PlayerBuilder.getLiabilityWaiverFileName(playerId);
        await s3.uploadFile(fileName, data, contentType, LIABILITY_WAIVER_PATH);
        await this.updateLiabilityWaiver(ddb, playerId, fileName);
    }

    async updateLiabilityWaiver(ddb: DynamoDb, playerId: string, fileName: string) {
        let key = {
            [PK_KEY]: {S: `${PlayerKey.PREFIX}.${playerId}`},
            [SK_KEY]: {S: `${PlayerKey.PREFIX}.data`}
        };
        let updateExpression = 'SET #waiverattr = :val';
        let expressionAttributeNames: Record<string, string> = {
            '#waiverattr': `${PlayerKey.LIABILITY_WAIVER}`,
        };
        let expressionAttributeValues: Record<string, AttributeValue> = {
            ':val': {S: fileName},
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
        playerRecord[PlayerKey.NUMBER] = {S: `${player.number}`};
        playerRecord[PlayerKey.CURP] = {S: `${player.curp}`};
        playerRecord[PlayerKey.LIABILITY_WAIVER] = {S: `${player.liabilityWaiver ?? ""}`};
        playerRecord[PlayerKey.IMAGE_TYPE] = {S: `${player.imageType?player.imageType:""}`};
        playerRecord[CY_KEY] = {S: TOURNAMENT_YEAR};
        playerRecord[PlayerKey.BIRTHDAY] = {S: `${player.birthday}`};
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
            age: item[PlayerKey.AGE].S ? item[PlayerKey.AGE].S! : "",
            height: item[PlayerKey.HEIGHT].S ? item[PlayerKey.HEIGHT].S! : "",
            weight: item[PlayerKey.WEIGHT].S ? item[PlayerKey.WEIGHT].S! : "",
            position: item[PlayerKey.POSITION].S ? item[PlayerKey.POSITION].S! : "",
            number: item[PlayerKey.NUMBER]?.S && item[PlayerKey.NUMBER].S !== "null" ? item[PlayerKey.NUMBER].S! : "",
            curp: item[PlayerKey.CURP]?.S ? item[PlayerKey.CURP].S! : "",
            liabilityWaiver: item[PlayerKey.LIABILITY_WAIVER]?.S ? item[PlayerKey.LIABILITY_WAIVER].S! : "",
            birthday: item[PlayerKey.BIRTHDAY].S ? item[PlayerKey.BIRTHDAY].S! : "",
            imageType: item[PlayerKey.IMAGE_TYPE] ? item[PlayerKey.IMAGE_TYPE].S : "",
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
            number: "",
            curp: "",
            liabilityWaiver: "",
            birthday: ""
        }
    }

    static positions = ['1', '2', '3', '4', '5']

    static defaultForm = {
        nombre: ['', Validators.required],
        equipo: ['', Validators.required],
        categoria: ['', Validators.required],
        altura: [''],
        peso: [''],
        numero: [''],
        curp: [''],
        bday: ['']
    }
}