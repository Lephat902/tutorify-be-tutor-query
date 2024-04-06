import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorQueryService } from './tutor-query.service';
import { TutorQueryController, TutorQueryEventHandlerController } from './controllers';
import { TutorRepository } from './tutor.repository';
import { entities } from './entities';
import { ProxiesModule } from '@tutorify/shared';
import { MutexService } from './mutexes';

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
    ProxiesModule,
  ],
  providers: [
    TutorQueryService,
    TutorRepository,
    MutexService,
  ],
  controllers: [
    TutorQueryController,
    TutorQueryEventHandlerController,
  ],
})
export class AppModule { }
