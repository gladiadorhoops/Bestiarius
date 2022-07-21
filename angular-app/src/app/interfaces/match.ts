import { Team } from "./team"

export interface Match {
    location: string
    time: string
    quarter: number
    visitorTeam: Team
    homeTeam: Team
}