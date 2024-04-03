import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { QueueNames } from "@tutorify/shared";
import { firstValueFrom } from "rxjs";
import { Tutor } from "src/entities";

@Injectable()
export class AuthProxy {
    constructor(
        @Inject(QueueNames.AUTH) private readonly client: ClientProxy,
    ) { }

    async getUserById(userId: string): Promise<Tutor> {
        return firstValueFrom(
            this.client.send<Tutor>({ cmd: "getUserById" }, userId)
        );
    }
}