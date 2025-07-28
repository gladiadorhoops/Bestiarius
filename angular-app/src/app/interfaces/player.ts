export interface Player {
    id: string,
    name: string,
    team: string,
    age: string,
    category: string,
    imageType?: string | undefined,
    height: string,
    weight: string,
    position: string,
    birthday: string,
    year?: string
}

export interface PlayerWithPhoto extends Player {
    imageUrl: string | ArrayBuffer | null | undefined
}

export enum PlayerKey {
    ID = 'id',
    NAME = 'nombre',
    AGE = 'edad',
    CATEGORY = 'categoria',
    HEIGHT = 'height',
    WEIGHT = 'weight',
    POSITION = 'position',
    BIRTHDAY = 'birthday',
    IMAGE_TYPE = 'image',
    PREFIX = 'player'
}

export enum Category {
    APRENDIZ = 'aprendiz',
    ELITE = 'elite'

}