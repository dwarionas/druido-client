import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../common/public.decorator';
import { DecksService } from './decks.service';
import { CreateDeckDto, UpdateDeckDto, ShareDeckDto } from './dto/deck.dto';

@UseGuards(JwtAuthGuard)
@Controller('decks')
export class DecksController {
    constructor(private readonly decksService: DecksService) { }

    @Get()
    getAll(@CurrentUser() userId: string, @Query('q') q?: string) {
        return this.decksService.getAll(userId, q);
    }

    @Get('summary')
    summary(@CurrentUser() userId: string, @Query('q') q?: string) {
        return this.decksService.summary(userId, q);
    }

    @Public()
    @Get('shared/:shareId')
    getShared(@Param('shareId') shareId: string) {
        return this.decksService.getShared(shareId);
    }

    @Post('shared/:shareId/clone')
    cloneShared(@CurrentUser() userId: string, @Param('shareId') shareId: string) {
        return this.decksService.cloneShared(userId, shareId);
    }

    @Post(':id/share')
    setSharing(
        @CurrentUser() userId: string,
        @Param('id') id: string,
        @Body() dto: ShareDeckDto,
    ) {
        return this.decksService.setSharing(userId, id, dto.isPublic);
    }

    @Get(':id')
    findById(@CurrentUser() userId: string, @Param('id') id: string) {
        return this.decksService.findById(userId, id);
    }

    @Post()
    create(@CurrentUser() userId: string, @Body() dto: CreateDeckDto) {
        return this.decksService.create(userId, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateDeckDto,
    ) {
        return this.decksService.update(userId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(@CurrentUser() userId: string, @Param('id') id: string) {
        return this.decksService.delete(userId, id);
    }
}
