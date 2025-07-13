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
    birthday: Date | undefined
    year?: string
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