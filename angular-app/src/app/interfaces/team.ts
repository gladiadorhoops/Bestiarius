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

export interface Team {
    id?: string | undefined
    name: string
    points?: number | undefined
    players?: Player[] | undefined
    category?: string | undefined
}