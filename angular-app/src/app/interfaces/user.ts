import { Role } from "../enum/Role";

export interface User {
    id: string,
    name: string,
    email: string,
    role: Role,
    phone: string,
}

export enum UserKey {
    ID = 'id',
    NAME = 'name',
    EMAIL = 'email',
    ROLE = 'role',
    PHONE = 'phone',
}