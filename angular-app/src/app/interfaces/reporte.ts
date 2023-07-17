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
    colada: Skill,
    media: Skill,
    triple: Skill,
    inteligencia: Skill,
}

export interface Defensa {
    conBola: Skill,
    sinBola: Skill,
    trancision: Skill,
    rebote: Skill,
}

export interface Jugador {
    hustle: Skill,
    spacing: Skill,
    juegoEquipo: Skill,
    agresividad: Skill,
}

export interface Pase {
    vision: Skill,
    creador: Skill,
    perdida: Skill,
    sentido: Skill,
}

export interface Bote {
    contol: Skill,
    presion: Skill,
    perdida: Skill,
    manoDebil: Skill,
    cambioRitmo: Skill,
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

export enum Section {
    TIROS = 'tiro',
    PASE = 'pase',
    DEFENSA = 'defensa',
    BOTE = 'bote',
    JUGADOR = 'jugador',
    ESTILO = 'estilo',
}

export interface Skill {
    value?: number | string | boolean | undefined
    localized?: string | undefined,
    report: string,
}

export class Skills {
    
    static tiros: { [key: string]: Skill } = {
        colada: {
            localized: 'Colada',
            report: 'colada',
        },
        media: {
            localized: 'Media',
            report: 'media',
        },
        triples: {
            localized: 'Triples',
            report: 'triples',
        },
        inteligencia: {
            localized: 'Inteligencia',
            report: 'inteligencia',
        },
    }

    static getTiros(): Skill[] {
        return Object.values(Skills.tiros).map((value: Skill) => {
            return value
        })
    }
    
    static pases = {
        vision: {
            localized: 'Vision',
            report: 'vision',
        },
        creador: {
            localized: 'Creador',
            report: 'creador',
        },
        sentido: {
            localized: 'Sentido',
            report: 'sentido',
        },
        perdida: {
            localized: 'Perdida de Balon',
            report: 'perdida.,'
        }
    }

    static getPases(): Skill[] {
        return Object.values(Skills.pases).map((value: Skill) => {
            return value
        })
    }
    
    static defensas = {
        conBola: {
            localized: 'Con Bola',
            report: 'conBola',
        },
        sinBola: {
            localized: 'Sin Bola',
            report: 'sinBola',
        },
        transicion: {
            localized: 'Transicion',
            report: 'transicion',
        },
        rebote: {
            localized: 'Rebote Defensivo',
            report: 'rebote',
        },
    }
    
    static getDefensas(): Skill[] {
        return Object.values(Skills.defensas).map((value: Skill) => {
            return value
        })
    }

    static botes = {
        control: {
            localized: 'Control',
            report: 'control',
        },
        presion: {
            localized: 'En Presion',
            report: 'presion',
        },
        perdida: {
            localized: 'Perdida de Balon',
            report: 'perdida',
        },
        manoDebil: {
            localized: 'Mano Debil',
            report: 'manoDebil',
        },
        ritmo: {
            localized: 'Cambio de Ritmo',
            report: 'ritmo',
        },
    }

    static getBotes(): Skill[] {
        return Object.values(Skills.botes).map((value: Skill) => {
            return value
        })
    }

    static jugadores = {
        hustle: {
            localized: 'Hustle',
            report: 'hustle'
        },
        spacing: {
            localized: 'Spacing',
            report: 'spacing'
        },
        juegoEquipo: {
            localized: 'Juego en Equipo',
            report: 'juegoEquipo'
        },
        tiroInteligente: {
            localized: 'Tiro Inteligente',
            report: 'tiroInteligente'
        },
        agresividad: {
            localized: 'Agresividad',
            report: 'agresividad'
        },
    }

    static getJugadores(): Skill[] {
        return Object.values(Skills.jugadores).map((value: Skill) => {
            return value
        })
    }

    static estilos = {
        anotador: {
            localized: 'Anotador',
            report: 'anotador',
        },
        defensor: {
            localized: 'Defensor',
            report: 'defensor',
        },
        creador: {
            localized: 'Creador',
            report: 'creador',
        },
        atletico: {
            localized: 'Atletico',
            report: 'atletico',
        },
        clutch: {
            localized: 'Clutch',
            report: 'clutch',
        },
        rebotador: {
            localized: 'Rebotador',
            report: 'rol',
        },
        rol: {
            localized: 'Rol',
            report: 'rol',
        },
    }

    static getEstilos(): Skill[] {
        return Object.values(Skills.estilos).map((value: Skill) => {
            return value
        })
    }
}