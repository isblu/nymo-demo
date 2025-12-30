// src/db/seed.ts
import { db } from './index'
import { users, posts } from './schema'

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('Clearing existing data...')
  await db.delete(posts)
  await db.delete(users)

  // Insert mock users
  console.log('Inserting mock users...')
  const insertedUsers = await db.insert(users).values([
    {
      email: 'alice@example.com',
      displayName: 'Alice Johnson',
      isActive: true,
    },
    {
      email: 'bob@example.com',
      displayName: 'Bob Smith',
      isActive: true,
    },
    {
      email: 'charlie@example.com',
      displayName: 'Charlie Brown',
      isActive: false,
    },
    {
      email: 'diana@example.com',
      displayName: 'Diana Prince',
      isActive: true,
    },
    {
      email: 'eve@example.com',
      displayName: 'Eve Wilson',
      isActive: true,
    },
  ]).returning()

  console.log(`✅ Inserted ${insertedUsers.length} users`)

  // Insert mock posts
  console.log('Inserting mock posts...')
  const insertedPosts = await db.insert(posts).values([
    {
      title: 'Getting Started with Drizzle ORM',
      content: 'Drizzle ORM is a lightweight TypeScript ORM that provides type-safe database access.',
      authorId: insertedUsers[0]!.id,
    },
    {
      title: 'Building APIs with Elysia',
      content: 'Elysia is a fast and flexible web framework for Bun with excellent developer experience.',
      authorId: insertedUsers[0]!.id,
    },
    {
      title: 'My First Post',
      content: 'Hello world! This is my first blog post.',
      authorId: insertedUsers[1]!.id,
    },
    {
      title: 'TypeScript Best Practices',
      content: 'Here are some tips for writing better TypeScript code...',
      authorId: insertedUsers[3]!.id,
    },
  ]).returning()

  console.log(`✅ Inserted ${insertedPosts.length} posts`)

  console.log('🎉 Seeding complete!')
  
  // Exit the process
  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
