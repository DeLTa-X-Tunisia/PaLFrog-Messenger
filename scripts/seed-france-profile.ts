
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'France';

    console.log(`Searching for user: ${username}...`);

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        console.error(`User '${username}' not found!`);
        return;
    }

    console.log(`Found user: ${user.id}. Updating profile...`);

    const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
            firstName: 'France',
            lastName: 'Dupont',
            country: 'France',
            profession: 'Développeuse Fullstack',
            maritalStatus: 'Célibataire',
            bio: 'Passionnée par le code et les nouvelles technologies. J\'aime voyager et découvrir de nouvelles cultures.',
            // Default visibility settings are already set by schema default, but let's be explicit for testing
            professionVisibility: 'PUBLIC',
            countryVisibility: 'PUBLIC',
            maritalStatusVisibility: 'CONTACTS',
        },
        create: {
            userId: user.id,
            firstName: 'France',
            lastName: 'Dupont',
            country: 'France',
            profession: 'Développeuse Fullstack',
            maritalStatus: 'Célibataire',
            bio: 'Passionnée par le code et les nouvelles technologies. J\'aime voyager et découvrir de nouvelles cultures.',
        },
    });

    console.log('Profile updated successfully:', profile);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
