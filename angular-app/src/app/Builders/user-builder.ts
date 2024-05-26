import { Injectable } from '@angular/core';
import { CY_KEY, DynamoDb, PK_KEY, SK_KEY } from "src/app/aws-clients/dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { User, UserKey } from '../interfaces/user';
import { Coach, CoachKey } from '../interfaces/coach';
import { Role } from '../enum/Role';
import { CURRENT_YEAR } from '../aws-clients/constants';
import { Scout } from '../interfaces/scout';
import { Admin } from '../interfaces/admin';

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
        let teamIds = item[CoachKey.TEAM_IDS]
        if (teamIds === undefined) return coach
        coach.teamIds = DynamoDb.convertToStringList(teamIds.L!)
        
        return coach
    }

    async getScout(ddb: DynamoDb, scoutId: string): Promise<Scout | undefined> {
        let item = await this.getUserItem(ddb, scoutId, Role.SCOUT)
        if(item === undefined) return
        return this.buildUser(item, Role.SCOUT) as Scout
    }

    async getAdmin(ddb: DynamoDb, adminId: string): Promise<Admin | undefined> {
        let item = await this.getUserItem(ddb, adminId, Role.ADMIN)
        if(item === undefined) return
        return this.buildUser(item, Role.ADMIN) as Admin
    }

    async getCoaches(ddb: DynamoDb): Promise<Coach[]> {
        var coaches: Coach[] = []
        coaches = await this.getUsers(ddb, Role.COACH) as Coach[]
        console.log('coaches', coaches)
        return coaches
    }

    async getScouts(ddb: DynamoDb): Promise<Scout[]> {
        var scouts: Scout[] = []
        scouts = await this.getUsers(ddb, Role.SCOUT) as Scout[]
        console.log('scouts', scouts)
        return scouts
    }

    async getAdmins(ddb: DynamoDb): Promise<Admin[]> {
        var admins: Admin[] = []
        admins = await this.getUsers(ddb, Role.ADMIN) as Admin[]
        console.log('admins', admins)
        return admins
    }

    async deleteCoach(ddb: DynamoDb, userId: string) {
        await this.deleteUserItem(ddb, userId, Role.COACH);
    }

    async deleteScout(ddb: DynamoDb, userId: string) {
        await this.deleteUserItem(ddb, userId, Role.SCOUT);
    }

    async deleteAdmin(ddb: DynamoDb, userId: string) {
        await this.deleteUserItem(ddb, userId, Role.ADMIN);
    }


    async getUsers(ddb: DynamoDb, role: Role): Promise<User[]> {
        var users: User[] = []
        users = await ddb.listByYearQuery(`${role}.data`).then(
            (items) => {
                items.sort((a, b) => a[UserKey.NAME].S!.localeCompare(b[UserKey.NAME].S!))
                return items.map((item) => {
                    let coach =  this.buildUser(item, Role.COACH) as Coach
                    let teamIds = item[CoachKey.TEAM_IDS]
                    if (teamIds === undefined) return coach
                    coach.teamIds = DynamoDb.convertToStringList(teamIds.L!)
                    return coach
                })
            }
        )
        return users
    }

    private updateCoachRecord(record: Record<string, any>, coach: Coach): Record<string, any> {
        if (coach.teamIds === undefined) return record 
        record[CoachKey.TEAM_IDS] = DynamoDb.convertFromStringList(coach.teamIds)
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
        return user;
    }

    private async getUserItem(ddb: DynamoDb, userId: string, role: Role): Promise<Record<string, AttributeValue> | undefined> {
        let record = {
            [PK_KEY]: {S: `${role}.${userId}`},
            [SK_KEY]: {S: `${role}.data`}
        }
        return await ddb.getItem(record);
    }

    private async deleteUserItem(ddb: DynamoDb, userId: string, role: Role) {
        let record: Record<string, AttributeValue> = {}
        record[PK_KEY] = {S: `${role}.${userId}`};
        record[SK_KEY] = {S: `${role}.data`};

        await ddb.deleteItem(record);
    }

    private createUserRecord(user: User): Record<string, any> {
        let record: Record<string, AttributeValue> = {}
        record[PK_KEY] = {S: `${user.role}.${user.id}`}
        record[SK_KEY] = {S: `${user.role}.data`}
        record[UserKey.NAME] = {S: `${user.name}`}
        record[UserKey.EMAIL] = {S: `${user.email}`}
        record[UserKey.PHONE] = {S: `${user.phone}`}
        record[CY_KEY] = {S: CURRENT_YEAR};
        return record
    }
}