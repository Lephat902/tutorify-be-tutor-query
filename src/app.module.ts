import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxiesModule } from '@tutorify/shared';
import { Controllers } from './controllers';
import { entities } from './entities';
import { MutexService } from './mutexes';
import { ClassCategoryRepository, TutorRepository } from './repositories';
import { ClassCategoryService, TutorQueryService } from './services';

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
    ClassCategoryService,
    ClassCategoryRepository,
    MutexService,
  ],
  controllers: Controllers,
})
export class AppModule { }
