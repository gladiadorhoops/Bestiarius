import { SPK_KEY } from "../aws-clients/dynamodb"

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

export enum PaymentStatus {
    PENDING = 'pendiente',
    IN_REVIEW = 'en_revision',
    APPROVED = 'aprovado',
}

export enum TeamKey {
    ID = 'id',
    NAME = 'name',
    CAPTAIN_ID = 'captainId',
    COACH_NAME = 'coachName',
    LOACTION = 'location',
    YEAR = 'cy',
    PREFIX = 'team',
    SK = 'team.data',
    CATEGORY = 'category',
    PAYMENT_STATUS = 'paymentStatus',
}

export interface Team {
    id: string
    name: string
    captainId: string | undefined
    coachId: string
    coachName: string | undefined
    category?: string
    location: string | undefined
    year?: string
    paymentStatus?: PaymentStatus
}

export interface MatchTeam {
    id: string
    name: string
    category?: string | undefined
    points?: number | undefined
}