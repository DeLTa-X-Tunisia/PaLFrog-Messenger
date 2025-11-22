"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = exports.UserRole = void 0;
const swagger_1 = require("@nestjs/swagger");
var UserRole;
(function (UserRole) {
    UserRole["SERVER_MASTER"] = "SERVER_MASTER";
    UserRole["SERVER_SUPER_ADMIN"] = "SERVER_SUPER_ADMIN";
    UserRole["SERVER_ADMIN"] = "SERVER_ADMIN";
    UserRole["SERVER_MODERATOR"] = "SERVER_MODERATOR";
    UserRole["SERVER_HELPER"] = "SERVER_HELPER";
    UserRole["SERVER_EDITOR"] = "SERVER_EDITOR";
    UserRole["POWER_USER_A"] = "POWER_USER_A";
    UserRole["POWER_USER_B"] = "POWER_USER_B";
    UserRole["POWER_USER_C"] = "POWER_USER_C";
    UserRole["USER"] = "USER";
    UserRole["GUEST"] = "GUEST";
})(UserRole || (exports.UserRole = UserRole = {}));
class UserEntity {
    constructor(partial) {
        Object.assign(this, partial);
        if (partial.profile) {
            this.avatarUrl = partial.profile.avatarUrl;
            this.firstName = partial.profile.firstName;
            this.lastName = partial.profile.lastName;
            this.bio = partial.profile.bio;
        }
    }
}
exports.UserEntity = UserEntity;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: UserRole }),
    __metadata("design:type", String)
], UserEntity.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Date)
], UserEntity.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "bio", void 0);
//# sourceMappingURL=user.entity.js.map