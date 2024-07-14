import { Role } from "../enum/Role";

export interface User {
    id: string,
    name: string,
    email: string,
    role: Role,
    phone: string,
    accessToken?: string | undefined,
    idToken?: string | undefined,
    admin?: boolean | undefined
}

export enum UserKey {
    ID = 'id',
    NAME = 'name',
    EMAIL = 'email',
    ROLE = 'role',
    PHONE = 'phone',
    ACCESS_TOKEN = 'accessToken'
}