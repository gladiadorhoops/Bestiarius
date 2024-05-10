export enum Role {
    SCOUT = 'scout',
    COACH = 'coach'
}

export function roleFromString(role: string): Role {
    if(role == Role.SCOUT) return Role.SCOUT
    if(role == Role.COACH) return Role.COACH
    throw new Error(`Role ${role} not supported`)
}
