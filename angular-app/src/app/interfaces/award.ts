
export interface Award {
    id?: string | undefined
    type?: string | undefined // equipo | individual
    category?: string | undefined // Aprendiz | Elite | Sagittarius | Tetraites | etc
    meaning?: string | undefined
    winners: string[]
}
