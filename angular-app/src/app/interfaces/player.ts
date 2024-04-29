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

export enum Category {
    APRENDIZ = 'aprendiz',
    ELITE = 'elite'

}