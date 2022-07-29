import { Team } from "./team"

export interface Match {
    location: string
    time: string
    juego: string
    visitorTeam: Team
    homeTeam: Team
}