import { Player } from "./player"

export interface Team {
    id?: string | undefined
    name: string
    points?: number | undefined
    players?: Player[] | undefined
    category?: string | undefined
}