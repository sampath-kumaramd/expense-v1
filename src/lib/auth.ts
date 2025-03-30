import { currentUser } from '@clerk/nextjs/server';

export async function auth() {
  const user = await currentUser();
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
    },
  };
}
