import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorQueryService } from './tutor-query.service';
import { TutorQueryController, TutorQueryEventHandlerController } from './controllers';
import { TutorRepository } from './tutor.repository';
import { entities } from './entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueNames } from '@tutorify/shared';
import { MutexService } from './mutexes';
import { Proxies } from './proxies';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: configService.get('DATABASE_TYPE'),
        url: configService.get('DATABASE_URI'),
        entities,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    ClientsModule.registerAsync([
      {
        name: QueueNames.AUTH,
        inject: [ConfigService], // Inject ConfigService
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI')],
            queue: QueueNames.AUTH,
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
      {
        name: QueueNames.USER_PREFERENCES,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI')],
            queue: QueueNames.USER_PREFERENCES,
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),
  ],
  providers: [
    TutorQueryService,
    TutorRepository,
    MutexService,
    ...Proxies,
  ],
  controllers: [
    TutorQueryController,
    TutorQueryEventHandlerController,
  ],
})
export class AppModule { }
