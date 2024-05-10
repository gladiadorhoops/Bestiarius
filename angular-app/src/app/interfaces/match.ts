import { MatchTeam } from "./team"

export interface Match {
    id?: string | undefined
    category?: string | undefined
    location: string
    day?: string | undefined
    time: string
    juego: string
    visitorTeam: MatchTeam
    visitorPoints?: string | undefined
    homeTeam: MatchTeam
    homePoints?: string | undefined
    braketPlace?: string | undefined
}