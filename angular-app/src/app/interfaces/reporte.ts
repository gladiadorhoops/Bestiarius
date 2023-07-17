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
    POCISION = 'pocision',
    TIRO = 'tiro',
    PASE = 'pase',
    DEFENSA = 'defensa',
    BOTE = 'bote',
    JUGADOR = 'jugador',
    ESTILO = 'estilo',
    GENERAL = 'general',
    NOMINACION = 'nominacion',
}

export interface Skill {
    value?: number | string | boolean | undefined
    localized?: string | undefined,
    report: string,
}

export class Skills {
    
    static posiciones = {
        base: {
            localized: '1 - Base',
            report: 'base',
        },
        escolta: {
            localized: '2 - Escolta',
            report: 'escolta',
        },
        alero: {
            localized: '3 - Alero',
            report: 'alero',
        },
        ala: {
            localized: '4 - Ala Pivot',
            report: 'ala',
        },
        pivot: {
            localized: '5 - Pivot',
            report: 'pivot',
        },
    }

    static getPocisiones(): Skill[] {
        return Object.values(Skills.posiciones).map((value: Skill) => {
            return value
        })
    }

    static tiros = {
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

    static general = {
        mejora: {
            localized: '1 - Necesita Mejora',
            report: 'general'
        },
        promedio: {
            localized: '2 - Promedio',
            report: 'general'
        },
        arriba: {
            localized: '3 - Arriba de Promedio',
            report: 'general'
        },
        bueno: {
            localized: '4 - Muy Buen',
            report: 'general'
        },
        gladiador: {
            localized: '5 - Gladiador',
            report: 'general'
        },
    }

    static getEvaluaciones(): Skill[] {
        return Object.values(Skills.general).map((value: Skill) => {
            return value
        })
    }

    static nominacion = {
        maximus: {
            localized: 'Maximus',
            report: 'maximus'
        },
    }

    static getNominaciones(): Skill[] {
        return Object.values(Skills.nominacion).map((value: Skill) => {
            return value
        })
    }
}