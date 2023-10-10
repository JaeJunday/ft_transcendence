import { Controller, Get, Param, ParseIntPipe, Req, Res, UseGuards } from '@nestjs/common';
import { DirectMessageService } from './directMessage.service';
import { JwtAuthGuard } from 'src/auth/jwtAuth.guard';
import { DirectMessage } from './directMessage.entity';
import { UserService } from 'src/user/user.service';

@Controller('DM')
export class DirectMessageController {
    constructor(
        private readonly directMessageService: DirectMessageService,
        private readonly userService: UserService,
    ) {}

    @Get('/with/:userName')
    @UseGuards(JwtAuthGuard)
    async getLoggedDMs(@Param('userName') userName: string, @Req() req, @Res() res) {
        const loggedDMs: DirectMessage[] = await this.directMessageService.findRecentDMs(req.user.sub, userName, 30);
        return res.status(200).json(loggedDMs);
    }
}
