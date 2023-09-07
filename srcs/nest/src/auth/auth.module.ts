import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from 'src/user/user.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { FortytwoAuthGuard } from './fortytwo.guard';
import { FortytwoStrategy } from './fortyTwo.strategy';
import { Auth42Dto } from './dto/auth42.dto';
import { UserModule } from 'src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
// import { JwtAuthGuard } from './jwtAuth.guard';

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('HTTP_TIMEOUT'),
                maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
            }),
            inject: [ConfigService],
        }),
        ConfigModule.forRoot({
            cache: true,
            isGlobal: true,
        }),
        TypeOrmModule.forFeature([UserRepository]),
        PassportModule.register({ defaultStrategy: 'fortytwo' }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        FortytwoAuthGuard,
        FortytwoStrategy,
        Auth42Dto,
        JwtService,
    ],
})
export class AuthModule {}
