import { Team } from "./team"

export interface Match {
    id?: string | undefined
    category?: string | undefined
    location: string
    day?: string | undefined
    time: string
    juego: string
    visitorTeam: Team
    visitorPoints?: string | undefined
    homeTeam: Team
    homePoints?: string | undefined
    braketPlace?: string | undefined
}