export enum Role {
    SCOUT = 'scout',
    COACH = 'coach',
    ADMIN = 'admin'
}

export function roleFromString(role: string): Role {
    if(role == Role.SCOUT) return Role.SCOUT
    if(role == Role.COACH) return Role.COACH
    if(role == Role.ADMIN) return Role.ADMIN
    throw new Error(`Role ${role} not supported`)
}
