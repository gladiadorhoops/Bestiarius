import { Player } from "./player"

export interface Team {
    id: String | undefined
    name: string
    points: number
    players: [Player] | undefined
}