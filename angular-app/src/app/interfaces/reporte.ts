export interface Reporte {
    pocisiones: [number],
    tiro: Tiro,
    defensa: Defensa,
    jugador: Jugador,
    pase: Pase,
    bote: Bote,
    estilo: [Estilo],
    evaluationGeneral: EvaluationGeneral
}

export interface Tiro {
    colada: number,
    media: number,
    triple: number,
    inteligencia: number,
}

export interface Defensa {
    conBola: number,
    sinBola: number,
    trancision: number,
    rebote: number,
}

export interface Jugador {
    hustle: number,
    spacing: number,
    juegoEquipo: number,
    agresividad: number,
}

export interface Pase {
    vision: number,
    creador: number,
    perdida: number,
    sentido: number,
}

export interface Bote {
    contol: number,
    presion: number,
    perdida: number,
    manoDebil: number,
    cambioRitmo: number,
}

export enum Estilo {
    Anotador,
    Defendor,
    Creador,
    Atletico,
    Clutch,
    Reboteador,
    Rol,
}

export enum EvaluationGeneral {
    Gladiador = 5,
    MuyBueno = 4,
    ArribaPromedio = 3,
    Promedio = 2,
    NecesitaMejora = 1
}