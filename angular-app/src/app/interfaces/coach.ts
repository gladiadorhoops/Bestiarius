import { User } from "./user";

export enum CoachKey {
    TEAM_IDS = "teamIds"
}

export interface Coach extends User {
    teamIds: string[]
}