import {Command} from "@dddl/cqrs"
import {IsEmail, IsUUID} from "class-validator"


export class RegisterUserPasswordlessCommand extends Command {
    @IsEmail()
    public email: string
    @IsUUID()
    public userId: string

    constructor(
        email: string,
        userId: string
    ) {
        super()
        this.email = email
        this.userId = userId
    }
}