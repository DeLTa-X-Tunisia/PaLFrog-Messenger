import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('conversations')
    async createConversation(@Request() req, @Body() body: { userIds: string[] }) {
        // Ensure current user is in the list
        const participants = [...new Set([...body.userIds, req.user.userId])];
        return this.chatService.createConversation(participants);
    }

    @Get('conversations')
    async getConversations(@Request() req) {
        return this.chatService.getConversations(req.user.userId);
    }

    @Post('conversations/:id/messages')
    async sendMessage(
        @Request() req,
        @Param('id') conversationId: string,
        @Body() body: { content: string; type?: 'TEXT' | 'FILE' | 'SYSTEM' }
    ) {
        return this.chatService.saveMessage(req.user.userId, conversationId, body.content, body.type);
    }

    @Get('conversations/:id/messages')
    async getMessages(@Request() req, @Param('id') conversationId: string) {
        return this.chatService.getMessages(conversationId, req.user.userId);
    }
}
