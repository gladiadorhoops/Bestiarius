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

export class LocalizedStrings {
    
    static tiros = {
        colada: 'Colada',
        media: 'Media',
        triples: 'Triples',
        Inteligencia: 'Inteligencia'
    }

    static getTiros(): string[] {
        return Object.values(LocalizedStrings.tiros).map((value: string) => {
            return value
        })
    }
    
    static pases = {
        vision: 'Vision',
        creador: 'Creador',
        perdida: 'Perdida de Balon',
        sentido: 'Sentido'
    }

    static getPases(): string[] {
        return Object.values(LocalizedStrings.pases).map((value: string) => {
            return value
        })
    }
    
    static defensas = {
        conBola: 'Con Bola',
        sinBola: 'Sin Bola',
        transicion: 'Transicion',
        rebote: 'Rebote Defensivo'
    }
    
    static getDefensas(): string[] {
        return Object.values(LocalizedStrings.defensas).map((value: string) => {
            return value
        })
    }

    static botes = {
        control: 'Control',
        presion: 'En Presion',
        perdida: 'Perdida de Balon',
        manoDebil: 'Mano Debil',
        ritmo: 'Cambio de Ritmo'
    }

    static getBotes(): string[] {
        return Object.values(LocalizedStrings.botes).map((value: string) => {
            return value
        })
    }

    static jugadores = {
        hustle: 'Hustle',
        spacing: 'Spacing',
        juegoEquipo: 'Juego en Equipo',
        tiroInteligente: 'Tiro Inteligente',
        agresividad: 'Agresividad',
    }

    static getJugadores(): string[] {
        return Object.values(LocalizedStrings.jugadores).map((value: string) => {
            return value
        })
    }

    static estilos = {
        anotador: 'Anotador',
        defensor: 'Defensor',
        creador: 'Creador',
        atletico: 'Atletico',
        clutch: 'Clutch',
        rebotador: 'Rebotador',
        rol: 'Rol',
    }

    static getEstilos(): string[] {
        return Object.values(LocalizedStrings.estilos).map((value: string) => {
            return value
        })
    }
}