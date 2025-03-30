import { getServerSession } from 'next-auth';

export async function auth() {
  const session = await getServerSession();
  return session;
}
