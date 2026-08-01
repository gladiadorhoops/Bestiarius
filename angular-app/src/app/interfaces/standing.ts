// Group-stage standings as computed by the Retiarius CreateStandings workflow
// and published to S3 as a single standings.json. These interfaces mirror that
// file's shape, so any change here has to match the workflow's output.

export interface StandingRow {
    // 1-based standing. Repeated across teams whose standing nothing settles —
    // same record, no game between them, same point differential — so positions
    // can skip (1, 2, 2, 4).
    position: number
    teamId: string
    teamName: string
    played: number
    won: number
    lost: number
    pointsFor: number
    pointsAgainst: number
    pointDifferential: number
}

export interface GroupStanding {
    category: string
    group: string
    standings: StandingRow[]
}
