import { Injectable } from '@angular/core';
import { DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { User, UserKey } from '../interfaces/user';
import { Coach, CoachKey } from '../interfaces/coach';
import { Role } from '../enum/Role';

@Injectable({
    providedIn: 'root'
})
export class UserBuilder {

    async createUser(ddb: DynamoDb, user: User) {
        var record = this.createUserRecord(user)

        if(user.role == Role.COACH) {
            record = this.updateCoachRecord(record, user as Coach)
        }

        console.log('Storing user data', record)
        await ddb.putItem(record);
    }


    async getCoach(ddb: DynamoDb, coachId: string): Promise<Coach | undefined> {
        let item = await this.getUserItem(ddb, coachId, Role.COACH)
        if(item === undefined) return
        
        let coach = this.buildUser(item, Role.COACH) as Coach
        coach.teamIds = DynamoDb.convertToStringList(item[CoachKey.TEAM_IDS].L!)
        
        return coach
    }

    private updateCoachRecord(record: Record<string, any>, coach: Coach): Record<string, any> { 
        let teamIdAttributes = DynamoDb.convertFromStringList(coach.teamIds)
        record[CoachKey.TEAM_IDS] = teamIdAttributes
        return record
    }

    private buildUser(item: Record<string, AttributeValue>, role: Role): User {
        var user =  {
            id: item[PK_KEY].S!,
            name: item[UserKey.NAME].S!,        
            email: item[UserKey.EMAIL].S!,
            phone: item[UserKey.PHONE].S!,
            role: role
        }
        return user
    }

    private async getUserItem(ddb: DynamoDb, userId: string, role: Role): Promise<Record<string, AttributeValue> | undefined> {
        let record = {
            [PK_KEY]: {S: `${role}.${userId}`},
            [SK_KEY]: {S: `${role}.data`}
        }
        return await ddb.getItem(record)
    }

    private createUserRecord(user: User): Record<string, any> {
        let record: Record<string, AttributeValue> = {}
        record[PK_KEY] = {S: `${user.role}.${user.id}`}
        record[SK_KEY] = {S: `${user.role}.data`}
        record[UserKey.NAME] = {S: `${user.name}`}
        record[UserKey.EMAIL] = {S: `${user.email}`}
        record[UserKey.PHONE] = {S: `${user.phone}`}
        return record
    }
}