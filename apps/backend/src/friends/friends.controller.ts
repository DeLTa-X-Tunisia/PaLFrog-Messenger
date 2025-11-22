import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) { }

    @Get('search')
    async search(@Request() req, @Query('q') query: string) {
        if (!query) {
            return this.friendsService.getAllUsers(req.user.userId);
        }
        return this.friendsService.searchUsers(query, req.user.userId);
    }

    @Get()
    async getFriends(@Request() req) {
        return this.friendsService.getFriends(req.user.userId);
    }

    @Post('add')
    async addFriend(@Request() req, @Body() body: { friendId: string }) {
        return this.friendsService.addFriend(req.user.userId, body.friendId);
    }

    @Post('block')
    async blockUser(@Request() req, @Body() body: { friendId: string }) {
        return this.friendsService.blockUser(req.user.userId, body.friendId);
    }

    @Post('remove')
    async removeFriend(@Request() req, @Body() body: { friendId: string }) {
        return this.friendsService.removeFriend(req.user.userId, body.friendId);
    }

    @Post('unblock')
    async unblockUser(@Request() req, @Body() body: { friendId: string }) {
        return this.friendsService.unblockUser(req.user.userId, body.friendId);
    }
}
