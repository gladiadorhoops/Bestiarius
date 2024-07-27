import { Gym } from "./gym"
import { MatchTeam } from "./team"

export interface Match {
    id?: string | undefined
    category?: string | undefined
    location: Gym
    day?: string | undefined
    time: string
    juego: string
    visitorTeam: MatchTeam
    visitorPoints?: string | undefined
    homeTeam: MatchTeam
    homePoints?: string | undefined
    braketPlace?: string | undefined
    singleTeam?: boolean | undefined
}