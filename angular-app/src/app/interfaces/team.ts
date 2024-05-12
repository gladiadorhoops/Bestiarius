import { Player } from "./player"

export enum Category {
    APRENDIZ = 'aprendiz',
    ELITE = 'elite',
}

export function getCategories(): string[] {
    return [
        Category.APRENDIZ,
        Category.ELITE
    ]
}

export enum TeamKey {
    ID = 'id',
    NAME = 'name',
    CAPTAIN_ID = 'captainId',
    COACH_ID = 'coachId',
    COACH_NAME = 'coachName',
    CATEGORY = 'category',
    LOACTION = 'location',
    PREFIX = 'team',
    SK = 'team.data'
}

export interface Team {
    id: string
    name: string
    captainId: string | undefined
    coachId: string
    coachName: string | undefined
    category?: string
    location: string | undefined
}

export interface MatchTeam {
    id: string
    name: string
    category?: string | undefined
    points?: number | undefined
}