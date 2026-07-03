import { IsString, IsOptional, IsArray, IsBoolean, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Language } from '@prisma/client';

export class CreateDeckDto {
    @IsString()
    @MinLength(1)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(Language)
    language?: string;

    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsOptional()
    @IsString()
    color?: string;
}

export class ShareDeckDto {
    @IsBoolean()
    isPublic!: boolean;
}

export class UpdateDeckDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(Language)
    language?: string;

    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsOptional()
    @IsString()
    color?: string;
}
