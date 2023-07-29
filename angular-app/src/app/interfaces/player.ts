export interface Player {
    id: string,
    nombre: string,
    equipo: string,
    edad: string,
    categoria: string,
}

export enum Category {
    APRENDIZ = 'aprendiz',
    ELITE = 'elite'

}