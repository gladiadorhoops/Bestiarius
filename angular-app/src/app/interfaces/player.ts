export interface Player {
    id: string,
    nombre: string,
    equipo: string,
    edad: string,
    categoria: string,

    height: string,
    weight: string,
    posicion: string,
    birthday: Date
}

export enum PlayerKey {
    ID = 'id',
    NAME = 'nombre',
    TEAM_ID = 'equipo',
    AGE = 'edad',
    CATEGORY = 'categoria',
    HEIGHT = 'height',
    WEIGHT = 'weight',
    POSITION = 'posicion',
    BIRTHDAY = 'birthday',
    PREFIX = 'player'
}

export enum Category {
    APRENDIZ = 'aprendiz',
    ELITE = 'elite'

}