import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    UpdateUserInfosDto,
    UpdateUserPasswordDto,
    UserContext,
    GetUserByIdReturnObj,
} from './usersDto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private authService: AuthService,
    ) {}

    async getAllUsers(): Promise<User[]> {
        const users = await this.prisma.user.findMany();

        if (users.length === 0) {
            throw new NotFoundException("Aucun utilisateur n'a été trouvé.");
        } else {
            return users;
        }
    }

    async getUserById(id: number): Promise<GetUserByIdReturnObj> {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                posts: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        comments: {
                            orderBy: { createdAt: 'asc' },
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                                likes: {},
                            },
                        },
                        likes: {},
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException("Aucun utilisateur n'a été trouvé");
        } else {
            return user;
        }
    }

    getUserContext(user: User): UserContext {
        const { id, email, firstName, lastName, admin } = user;
        return { id, email, firstName, lastName, isAdmin: admin };
    }

    async updateUserInfos(
        user: User,
        userInfos: UpdateUserInfosDto,
    ): Promise<[{ accessToken: string }, UserContext]> {
        try {
            const { id } = user;
            const { email, firstName, lastName } = userInfos;
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    email,
                    firstName,
                    lastName,
                },
            });

            const token = this.authService.generateToken(id, updatedUser.email);
            const userContext = this.getUserContext(updatedUser);

            return [token, userContext];
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException(
                    'Un compte existe déjà avec cette adresse email',
                );
            } else {
                throw new InternalServerErrorException(error);
            }
        }
    }

    async updateUserPassword(
        user: User,
        userInfos: UpdateUserPasswordDto,
    ): Promise<{ accessToken: string }> {
        try {
            const { id } = user;
            const { password } = userInfos;
            const hashedPassword = await this.authService.hashPassword(
                password,
            );
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    password: hashedPassword,
                },
            });
            return this.authService.generateToken(id, updatedUser.email);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    async deleteUser(user: User): Promise<void> {
        try {
            const { id } = user;
            await this.prisma.user.delete({
                where: { id },
            });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
