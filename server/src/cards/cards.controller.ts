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
    ParseUUIDPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, ReviewCardDto } from './dto/card.dto';
import { BulkCreateCardsDto } from './dto/cards-bulk.dto';

@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @Get()
    list(
        @CurrentUser() userId: string,
        @Query('deckId') deckId?: string,
        @Query('q') q?: string,
        @Query('tag') tag?: string,
        @Query('skip') skip?: number,
        @Query('take') take?: number,
    ) {
        return this.cardsService.list(userId, deckId, q, tag, skip, take);
    }

    @Get('due')
    getDueCards(
        @CurrentUser() userId: string,
        @Query('deckId') deckId?: string,
    ) {
        return this.cardsService.getDueCards(userId, deckId);
    }

    @Get(':id')
    findOne(@CurrentUser() userId: string, @Param('id') id: string) {
        return this.cardsService.findOne(userId, id);
    }

    @Get(':id/schedule')
    getSchedulePreview(@CurrentUser() userId: string, @Param('id') id: string) {
        return this.cardsService.getSchedulePreview(userId, id);
    }

    @Post()
    create(@CurrentUser() userId: string, @Body() dto: CreateCardDto) {
        return this.cardsService.create(userId, dto);
    }

    @Post('bulk')
    bulkCreate(
        @CurrentUser() userId: string,
        @Body() dto: BulkCreateCardsDto,
    ) {
        return this.cardsService.bulkCreate(userId, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateCardDto,
    ) {
        return this.cardsService.update(userId, id, dto);
    }

    @Post(':id/review')
    review(
        @CurrentUser() userId: string,
        @Param('id') id: string,
        @Body() dto: ReviewCardDto,
    ) {
        return this.cardsService.review(userId, id, dto);
    }

    @Delete('bulk')
    @HttpCode(HttpStatus.NO_CONTENT)
    bulkDelete(
        @CurrentUser() userId: string,
        @Query('deckId') deckId: string,
    ) {
        return this.cardsService.bulkDelete(userId, deckId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() userId: string, @Param('id') id: string) {
        return this.cardsService.remove(userId, id);
    }
}
