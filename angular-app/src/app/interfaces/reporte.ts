export interface Reporte {
    playerId: string,
    categoria: string,
    scout: string,
    posicion?: number[] | undefined,
    tiro?: Tiro | undefined,
    defensa?: Defensa | undefined,
    jugador?: Jugador | undefined,
    pase?: Pase | undefined,
    bote?: Bote | undefined,
    estilo?: Estilo[] | undefined,
    general?: EvaluationGeneral | undefined,
}

export interface TopAware {
    name: string,
    limit: number,
    top: TopScore[]
}

export type TopReporte = TopAware[]

export interface Tiro {
    colada?: Skill | undefined,
    media?: Skill | undefined,
    triple?: Skill | undefined,
    inteligencia?: Skill | undefined,
}

export interface Defensa {
    conBola?: Skill | undefined,
    sinBola?: Skill | undefined,
    trancision?: Skill | undefined,
    rebote?: Skill | undefined,
}

export interface Jugador {
    hustle?: Skill | undefined,
    spacing?: Skill | undefined,
    juegoEquipo?: Skill | undefined,
    agresividad?: Skill | undefined,
}

export interface Pase {
    vision?: Skill | undefined,
    creador?: Skill | undefined,
    perdida?: Skill | undefined,
    sentido?: Skill | undefined,
}

export interface Bote {
    contol?: Skill | undefined,
    presion?: Skill | undefined,
    perdida?: Skill | undefined,
    manoDebil?: Skill | undefined,
    cambioRitmo: Skill | undefined,
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
    CATEGORIA = 'categoria',
    POSICION = 'posicion',
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

export interface TopScore {
    playerId: string,
    score: number,
    name: string,
    team: string,
}

export type topScoreMap = {[section: string]: TopScore}

export class Skills {

    static playerDetails = {
        scoutId: 'scoutId',
        scoutname: 'scoutname',
        playerId: 'playerId',
        equipo: 'equipo',
        categoria: 'categoria'
    }
    
    static posicion = {
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

    static getPosiciones(): Skill[] {
        return Object.values(Skills.posicion).map((value: Skill) => {
            return value
        })
    }

    static tiro = {
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
        return Object.values(Skills.tiro).map((value: Skill) => {
            return value
        })
    }
    
    static pase = {
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
            report: 'perdida'
        }
    }

    static getPases(): Skill[] {
        return Object.values(Skills.pase).map((value: Skill) => {
            return value
        })
    }
    
    static defensa = {
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
        return Object.values(Skills.defensa).map((value: Skill) => {
            return value
        })
    }

    static bote = {
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
        return Object.values(Skills.bote).map((value: Skill) => {
            return value
        })
    }

    static jugador = {
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
        return Object.values(Skills.jugador).map((value: Skill) => {
            return value
        })
    }

    static estilo = {
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
        return Object.values(Skills.estilo).map((value: Skill) => {
            return value
        })
    }

    static general = {
        mejora: {
            localized: 'Necesita Mejora',
            report: 'general',
            value: 1            
        },
        promedio: {
            localized: 'Promedio',
            report: 'general',
            value: 2
        },
        arriba: {
            localized: 'Arriba de Promedio',
            report: 'general',
            value: 3
        },
        bueno: {
            localized: 'Muy Bueno',
            report: 'general',
            value: 4
        },
        gladiador: {
            localized: 'Gladiador',
            report: 'general',
            value: 5
        },
    }
    
    static getEvaluaciones(): Skill[] {
        return Object.values(Skills.general).map((value: Skill) => {
            return value
        })
    }

    static nominacion = {
        centuriones: {
            localized: 'Centuriones (Jugadores mas destacados)',
            report: 'centuriones'
        },
        scutum: {
            localized: 'Scutum Shield (Mejor Defensa)',
            report: 'scutum'
        },
        spartacus: {
            localized: 'Spartacus (MVP)',
            report: 'spartacus'
        },
        flamma: {
            localized: 'Flamma (Gladiador)',
            report: 'flamma'
        },
        maximus: {
            localized: 'Maximus (Mejor Overall)',
            report: 'maximus'
        },
        copellarius: {
            localized: 'Copellarius (Jugador mas Completo)',
            report: 'copellarius'
        },
        publius: {
            localized: 'Publius Ostorius (Mejor Anotador)',
            report: 'publius'
        },
        retiarius: {
            localized: 'Retiarius (Mejor Prospecto)',
            report: 'retiarius'
        },
        provocator: {
            localized: 'Provocator (Mejor Jugador Rol)',
            report: 'provocator'
        },
        colosseum: {
            localized: 'Colosseum (Spormanchip)',
            report: 'colosseum'
        },
        crixus: {
            localized: 'Crixus (6to Hombre)',
            report: 'crixus'
        }
    }

    static getNominaciones(): Skill[] {
        return Object.values(Skills.nominacion).map((value: Skill) => {
            return value
        })
    }

    static findSection(section: string): {[key: string]: Skill} | undefined {
        switch(section){
            case Section.POSICION:
                return Skills.posicion
            case Section.TIRO:
                return Skills.tiro
            case Section.PASE:
                return Skills.pase
            case Section.DEFENSA:
                return Skills.defensa
            case Section.BOTE:
                return Skills.bote
            case Section.JUGADOR:
                return Skills.jugador
            case Section.ESTILO:
                return Skills.estilo
            case Section.GENERAL:
                return Skills.general
            case Section.NOMINACION:
                return Skills.nominacion
            default:
                return undefined
        }
    }
}